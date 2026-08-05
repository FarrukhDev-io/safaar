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
import { authSessionStore } from '../auth/session-store';
import { verifyJwt } from '../auth/security';
import { corsOriginsFromEnv } from '../config/cors';
import { PostgresService } from '../infrastructure/postgres.service';
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
    origin: corsOriginsFromEnv(process.env.CORS_ORIGINS),
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

  constructor(private readonly pg: PostgresService) {}

  // ── Connection lifecycle ──────────────────────────────────────────────

  async handleConnection(client: AuthenticatedSocket) {
    this.clients.set(client.id, client);

    try {
      const token = this.tokenFromSocket(client);

      if (token) {
        const payload = verifyJwt(token, 'access');
        if (
          !payload ||
          !(await authSessionStore.isActive(payload.session_id))
        ) {
          client.emit('server:error', {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Realtime uchun yaroqli token kerak',
          });
          client.disconnect(true);
          return;
        }

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
    const room = this.safeRoomName(data?.room);
    if (!room) return;
    if (!(await this.canJoinRoom(client, room))) {
      this.emitSecurityError(client, 'REALTIME_ROOM_FORBIDDEN');
      return;
    }

    await client.join(room);

    if (this.isSupportRoom(room)) {
      const rooms = this.supportRoomsByClient.get(client.id) ?? new Set();
      rooms.add(room);
      this.supportRoomsByClient.set(client.id, rooms);
      this.emitSupportPresence(room);
    }

    this.logger.debug(`Client ${client.id} joined room: ${room}`);
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

  private tokenFromSocket(client: Socket): string | undefined {
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    const authToken = typeof auth?.token === 'string' ? auth.token.trim() : '';
    if (authToken) return this.bearerToken(authToken);

    const headers = client.handshake.headers as Record<
      string,
      string | string[] | undefined
    >;
    const header = headers.authorization;
    const authorization = Array.isArray(header) ? header[0] : header;
    return this.bearerToken(authorization);
  }

  private bearerToken(value: string | undefined): string | undefined {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    return trimmed.startsWith('Bearer ')
      ? trimmed.slice('Bearer '.length).trim()
      : trimmed;
  }

  private safeRoomName(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const room = value.trim();
    if (!room || room.length > 160 || hasControlChars(room)) {
      return undefined;
    }
    return room;
  }

  private async canJoinRoom(
    client: AuthenticatedSocket,
    room: string,
  ): Promise<boolean> {
    if (room === 'admin:all') {
      return this.isAdminSocket(client);
    }

    if (room.startsWith('partner:')) {
      const organizationId = room.slice('partner:'.length);
      return (
        this.isAdminSocket(client) ||
        Boolean(organizationId && client.organizationId === organizationId)
      );
    }

    if (room.startsWith('user:')) {
      const userId = room.slice('user:'.length);
      return (
        this.isAdminSocket(client) ||
        Boolean(userId && client.userId === userId)
      );
    }

    if (room.startsWith('support:')) {
      return this.canJoinSupportRoom(client, this.supportTicketId(room));
    }

    if (room.startsWith('booking:')) {
      return this.canJoinBookingRoom(client, room.slice('booking:'.length));
    }

    return false;
  }

  private async canJoinSupportRoom(
    client: AuthenticatedSocket,
    ticketId: string,
  ): Promise<boolean> {
    if (!this.isUuid(ticketId) || !client.userId) return false;
    if (this.isAdminSocket(client)) return true;

    const [ticket] = await this.pg.query<{
      user_id: string | null;
      actor_type: string;
      actor_id: string | null;
    }>(
      `SELECT user_id::text, actor_type::text, actor_id::text
       FROM support_tickets
       WHERE id = $1::uuid
       LIMIT 1`,
      [ticketId],
    );
    if (!ticket) return false;
    if (ticket.user_id === client.userId) return true;

    const partnerActorIds = [client.userId, client.organizationId].filter(
      Boolean,
    );
    return (
      ticket.actor_type === 'partner' &&
      Boolean(ticket.actor_id && partnerActorIds.includes(ticket.actor_id))
    );
  }

  private async canJoinBookingRoom(
    client: AuthenticatedSocket,
    bookingId: string,
  ): Promise<boolean> {
    if (!this.isUuid(bookingId) || !client.userId) return false;
    if (this.isAdminSocket(client)) return true;

    const [booking] = await this.pg.query<{
      user_id: string | null;
      partner_organization_id: string | null;
    }>(
      `SELECT user_id::text, partner_organization_id::text
       FROM bookings
       WHERE id = $1::uuid
       LIMIT 1`,
      [bookingId],
    );
    return Boolean(
      booking &&
      ((booking.user_id && booking.user_id === client.userId) ||
        (booking.partner_organization_id &&
          booking.partner_organization_id === client.organizationId)),
    );
  }

  private isAdminSocket(client: AuthenticatedSocket): boolean {
    return client.actorType === 'admin' || client.role === Role.SUPER_ADMIN;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private emitSecurityError(client: AuthenticatedSocket, code: string) {
    client.emit('server:error', {
      code,
      message: 'Realtime xonasiga kirish uchun ruxsat yo‘q',
    });
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

function hasControlChars(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 31 || code === 127) {
      return true;
    }
  }
  return false;
}
