import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { Role } from '@safaar/types';
import { verifyJwt } from '../auth/security';
import { SERVER_EVENTS, CLIENT_EVENTS } from './events';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
  organizationId?: string;
  actorType?: string;
}

interface SupportPresenceParticipant {
  userId: string;
  role?: string;
  actorType?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  private readonly clients = new Map<string, AuthenticatedSocket>();
  private readonly supportRoomsByClient = new Map<string, Set<string>>();

  // ── Connection lifecycle ──────────────────────────────────────────────

  handleConnection(client: AuthenticatedSocket) {
    this.clients.set(client.id, client);

    try {
      const token =
        (client.handshake.auth?.token as string) ??
        (client.handshake.headers?.authorization as string)?.replace(
          'Bearer ',
          '',
        );

      if (token) {
        const payload = verifyJwt(token, 'access');
        if (payload) {
          client.userId = payload.sub;
          client.role = payload.role;
          client.organizationId = payload.organization_id ?? undefined;
          client.actorType = payload.actor_type;

          // Auto-join role-based rooms
          if (
            payload.actor_type === 'admin' ||
            payload.role === Role.SUPER_ADMIN
          ) {
            void client.join('admin:all');
          }
          if (payload.organization_id) {
            void client.join(`partner:${payload.organization_id}`);
          }
          if (payload.sub) {
            void client.join(`user:${payload.sub}`);
          }
        }
      }

      this.logger.debug(
        `Client connected: ${client.id} (user=${client.userId ?? 'anon'})`,
      );
    } catch {
      this.logger.debug(`Client connected without auth: ${client.id}`);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const supportRooms = this.supportRoomsByClient.get(client.id) ?? new Set();

    for (const room of supportRooms) {
      if (client.userId) {
        this.server.to(room).emit(SERVER_EVENTS.SUPPORT_TYPING, {
          ticketId: this.supportTicketId(room),
          isTyping: false,
          userId: client.userId,
          role: client.role,
          actorType: client.actorType,
        });
      }
    }

    this.supportRoomsByClient.delete(client.id);
    this.clients.delete(client.id);

    for (const room of supportRooms) {
      this.emitSupportPresence(room);
    }

    this.logger.debug(
      `Client disconnected: ${client.id} (user=${client.userId ?? 'anon'})`,
    );
  }

  // ── Client → Server messages ──────────────────────────────────────────

  @SubscribeMessage(CLIENT_EVENTS.ROOM_JOIN)
  async handleRoomJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (!data?.room) return;
    await client.join(data.room);

    if (this.isSupportRoom(data.room)) {
      const rooms = this.supportRoomsByClient.get(client.id) ?? new Set();
      rooms.add(data.room);
      this.supportRoomsByClient.set(client.id, rooms);
      this.emitSupportPresence(data.room);
    }

    this.logger.debug(`Client ${client.id} joined room: ${data.room}`);
  }

  @SubscribeMessage(CLIENT_EVENTS.ROOM_LEAVE)
  async handleRoomLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (!data?.room) return;

    if (this.isSupportRoom(data.room) && client.userId) {
      client.to(data.room).emit(SERVER_EVENTS.SUPPORT_TYPING, {
        ticketId: this.supportTicketId(data.room),
        isTyping: false,
        userId: client.userId,
        role: client.role,
        actorType: client.actorType,
      });
    }

    await client.leave(data.room);

    if (this.isSupportRoom(data.room)) {
      const rooms = this.supportRoomsByClient.get(client.id);
      rooms?.delete(data.room);
      if (rooms?.size === 0) {
        this.supportRoomsByClient.delete(client.id);
      }
      this.emitSupportPresence(data.room);
    }

    this.logger.debug(`Client ${client.id} left room: ${data.room}`);
  }

  @SubscribeMessage(CLIENT_EVENTS.SUPPORT_TYPING)
  handleSupportTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { ticketId?: string; isTyping?: boolean },
  ) {
    const ticketId = data?.ticketId?.trim();
    if (!client.userId || !ticketId || typeof data.isTyping !== 'boolean') {
      return;
    }

    const room = `support:${ticketId}`;
    if (!client.rooms.has(room)) return;

    client.to(room).emit(SERVER_EVENTS.SUPPORT_TYPING, {
      ticketId,
      isTyping: data.isTyping,
      userId: client.userId,
      role: client.role,
      actorType: client.actorType,
    });
  }

  // ── Server → Client events (via EventEmitter2) ───────────────────────

  @OnEvent(SERVER_EVENTS.NOTIFICATION_CREATED)
  handleNotificationCreated(payload: {
    userId: string;
    notification: unknown;
  }) {
    this.server
      .to(`user:${payload.userId}`)
      .emit(SERVER_EVENTS.NOTIFICATION_CREATED, payload.notification);
  }

  @OnEvent(SERVER_EVENTS.BOOKING_STATUS_CHANGED)
  handleBookingStatusChanged(payload: {
    booking: Record<string, unknown>;
    previousStatus?: string;
    userId?: string;
    partnerId?: string;
  }) {
    const event = {
      ...payload.booking,
      previousStatus: payload.previousStatus,
    };

    // Notify the user who owns the booking
    if (payload.userId) {
      this.server
        .to(`user:${payload.userId}`)
        .emit(SERVER_EVENTS.BOOKING_STATUS_CHANGED, event);
    }

    // Notify the partner organization
    if (payload.partnerId) {
      this.server
        .to(`partner:${payload.partnerId}`)
        .emit(SERVER_EVENTS.BOOKING_STATUS_CHANGED, event);
    }

    // Notify admins
    this.server
      .to('admin:all')
      .emit(SERVER_EVENTS.BOOKING_STATUS_CHANGED, event);
  }

  @OnEvent(SERVER_EVENTS.PAYMENT_STATUS_CHANGED)
  handlePaymentStatusChanged(payload: { payment: Record<string, unknown> }) {
    this.server
      .to('admin:all')
      .emit(SERVER_EVENTS.PAYMENT_STATUS_CHANGED, payload.payment);
  }

  @OnEvent(SERVER_EVENTS.SUPPORT_MESSAGE_CREATED)
  handleSupportMessageCreated(payload: {
    ticketId: string;
    message: Record<string, unknown>;
    ticket: Record<string, unknown>;
    partnerId?: string | null;
    userId?: string | null;
  }) {
    const room = `support:${payload.ticketId}`;

    // Broadcast to anyone in the ticket room
    this.server.to(room).emit(SERVER_EVENTS.SUPPORT_MESSAGE_CREATED, {
      ticketId: payload.ticketId,
      message: payload.message,
    });

    // Also notify partner org if present
    if (payload.partnerId) {
      this.server
        .to(`partner:${payload.partnerId}`)
        .emit(SERVER_EVENTS.SUPPORT_MESSAGE_CREATED, {
          ticketId: payload.ticketId,
          message: payload.message,
        });
    }

    // Also notify user if present
    if (payload.userId) {
      this.server
        .to(`user:${payload.userId}`)
        .emit(SERVER_EVENTS.SUPPORT_MESSAGE_CREATED, {
          ticketId: payload.ticketId,
          message: payload.message,
        });
    }

    // Notify admin dashboard
    this.server.to('admin:all').emit(SERVER_EVENTS.SUPPORT_MESSAGE_CREATED, {
      ticketId: payload.ticketId,
      message: payload.message,
    });
  }

  @OnEvent(SERVER_EVENTS.SUPPORT_TICKET_UPDATED)
  handleSupportTicketUpdated(payload: {
    ticket: Record<string, unknown>;
    partnerId?: string | null;
    userId?: string | null;
  }) {
    if (payload.partnerId) {
      this.server
        .to(`partner:${payload.partnerId}`)
        .emit(SERVER_EVENTS.SUPPORT_TICKET_UPDATED, payload.ticket);
    }
    if (payload.userId) {
      this.server
        .to(`user:${payload.userId}`)
        .emit(SERVER_EVENTS.SUPPORT_TICKET_UPDATED, payload.ticket);
    }
    this.server
      .to('admin:all')
      .emit(SERVER_EVENTS.SUPPORT_TICKET_UPDATED, payload.ticket);
  }

  @OnEvent(SERVER_EVENTS.BOOKING_MESSAGE_CREATED)
  handleBookingMessageCreated(payload: {
    bookingId: string;
    message: Record<string, unknown>;
    partnerId?: string;
  }) {
    const room = `booking:${payload.bookingId}`;
    this.server.to(room).emit(SERVER_EVENTS.BOOKING_MESSAGE_CREATED, payload);

    if (payload.partnerId) {
      this.server
        .to(`partner:${payload.partnerId}`)
        .emit(SERVER_EVENTS.BOOKING_MESSAGE_CREATED, payload);
    }
  }

  @OnEvent(SERVER_EVENTS.PARTNER_DASHBOARD_UPDATED)
  handlePartnerDashboardUpdated(payload: { partnerId: string }) {
    this.server
      .to(`partner:${payload.partnerId}`)
      .emit(SERVER_EVENTS.PARTNER_DASHBOARD_UPDATED, payload);
  }

  @OnEvent(SERVER_EVENTS.ADMIN_DASHBOARD_UPDATED)
  handleAdminDashboardUpdated() {
    this.server.to('admin:all').emit(SERVER_EVENTS.ADMIN_DASHBOARD_UPDATED, {});
  }

  @OnEvent(SERVER_EVENTS.HOTEL_LISTING_CHANGED)
  handleHotelListingChanged(payload: {
    hotelId: string;
    partnerId?: string | null;
    status: string;
    previousStatus?: string;
    rejectionReason?: string | null;
    notificationId?: string | null;
    draftId?: string | null;
    action: string;
    sections: string[];
    occurredAt: string;
  }) {
    this.server
      .to('admin:all')
      .emit(SERVER_EVENTS.HOTEL_LISTING_CHANGED, payload);
    if (payload.partnerId) {
      this.server
        .to(`partner:${payload.partnerId}`)
        .emit(SERVER_EVENTS.HOTEL_LISTING_CHANGED, payload);
    }
  }

  @OnEvent(SERVER_EVENTS.HOTEL_SUBMITTED_FOR_REVIEW)
  handleHotelSubmittedForReview(payload: Record<string, unknown>) {
    this.server
      .to('admin:all')
      .emit(SERVER_EVENTS.HOTEL_SUBMITTED_FOR_REVIEW, payload);
  }

  @OnEvent(SERVER_EVENTS.HOTEL_MODERATION_CHANGED)
  handleHotelModerationChanged(payload: Record<string, unknown>) {
    this.server
      .to('admin:all')
      .emit(SERVER_EVENTS.HOTEL_MODERATION_CHANGED, payload);
    const partnerId = payload['partnerId'];
    if (typeof partnerId === 'string' && partnerId) {
      this.server
        .to(`partner:${partnerId}`)
        .emit(SERVER_EVENTS.HOTEL_MODERATION_CHANGED, payload);
    }
  }

  @OnEvent(SERVER_EVENTS.PROMOS_UPDATED)
  handlePromosUpdated(payload: { occurredAt: string }) {
    // Promo-kodlar hamma uchun ochiq — xona/organizatsiyaga bog'liq emas,
    // shuning uchun ulangan barcha clientlarga (anonim tashrif buyuruvchilar
    // ham) yuboriladi.
    this.server.emit(SERVER_EVENTS.PROMOS_UPDATED, payload);
  }

  private isSupportRoom(room: string): boolean {
    return room.startsWith('support:') && room.length > 'support:'.length;
  }

  private supportTicketId(room: string): string {
    return room.slice('support:'.length);
  }

  private emitSupportPresence(room: string) {
    if (!this.isSupportRoom(room)) return;

    const participants = new Map<string, SupportPresenceParticipant>();
    for (const client of this.clients.values()) {
      if (!client.userId || !client.rooms.has(room)) continue;
      participants.set(client.userId, {
        userId: client.userId,
        role: client.role,
        actorType: client.actorType,
      });
    }

    this.server.to(room).emit(SERVER_EVENTS.SUPPORT_PRESENCE_CHANGED, {
      ticketId: this.supportTicketId(room),
      participants: [...participants.values()],
    });
  }
}
