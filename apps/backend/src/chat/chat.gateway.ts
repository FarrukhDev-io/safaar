import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { RequestActor } from '../common/actor';
import { corsOriginsFromEnv } from '../config/cors';
import { authSessionStore } from '../auth/session-store';
import { verifyJwt } from '../auth/security';
import { ChatService } from './chat.service';

interface ChatSocket extends Socket {
  actor?: RequestActor;
}

@WebSocketGateway({
  namespace: '/ws/chat',
  cors: {
    origin: corsOriginsFromEnv(process.env.CORS_ORIGINS),
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: ChatSocket) {
    const actor = this.actorFromSocket(client);
    if (!actor || !(await this.isSessionActive(actor))) {
      client.emit('server:error', {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Chat uchun yaroqli token kerak',
      });
      client.disconnect(true);
      return;
    }

    client.actor = actor;
    void client.join(`actor:${actor.actorType}:${actor.id}`);
    this.logger.debug(
      `Chat connected: ${client.id} (${actor.actorType}:${actor.id})`,
    );
  }

  handleDisconnect(client: ChatSocket) {
    this.logger.debug(
      `Chat disconnected: ${client.id} (${client.actor?.id ?? 'anon'})`,
    );
  }

  @SubscribeMessage('client:join_room')
  async joinRoom(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: { roomId?: string },
  ) {
    if (!client.actor) return;
    try {
      const room = await this.chatService.roomForJoin(
        client.actor,
        data?.roomId,
      );
      await client.join(roomName(room.id));
      const payload = {
        roomId: room.id,
        status: room.status,
        userId: room.user_id,
      };
      client.emit('server:room_joined', payload);
      return payload;
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('client:send_message')
  async sendMessage(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: { roomId?: string; text?: string },
  ) {
    if (!client.actor || !data?.roomId) return;
    try {
      const message = await this.chatService.sendMessage(
        client.actor,
        data.roomId,
        String(data.text ?? ''),
      );
      this.server.to(roomName(data.roomId)).emit('server:receive_message', {
        id: message.id,
        senderId: message.senderId,
        senderType: message.senderType,
        text: message.text,
        createdAt: message.createdAt,
      });
      return message;
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('client:typing_status')
  async typingStatus(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: { roomId?: string; isTyping?: boolean },
  ) {
    if (!client.actor || !data?.roomId || typeof data.isTyping !== 'boolean') {
      return;
    }
    try {
      await this.chatService.assertRoomAccess(client.actor, data.roomId);
      client.to(roomName(data.roomId)).emit('server:typing_status', {
        roomId: data.roomId,
        isTyping: data.isTyping,
      });
    } catch (error) {
      this.emitError(client, error);
    }
  }

  private actorFromSocket(client: Socket): RequestActor | undefined {
    const token =
      firstString(client.handshake.auth?.token) ??
      bearerToken(firstString(client.handshake.headers.authorization)) ??
      firstString(client.handshake.query.token);

    if (!token) return undefined;
    const payload = verifyJwt(token, 'access');
    if (!payload) return undefined;

    return {
      id: payload.sub,
      actorType: payload.actor_type,
      role: payload.role,
      roles: payload.roles?.length ? payload.roles : [payload.role],
      organizationId: payload.organization_id ?? undefined,
      sessionId: payload.session_id,
    };
  }

  private async isSessionActive(actor: RequestActor): Promise<boolean> {
    if (!actor.sessionId) return false;
    return authSessionStore.isActive(actor.sessionId);
  }

  private emitError(client: ChatSocket, error: unknown) {
    const response = error as {
      response?: { code?: string; message?: string };
      message?: string;
    };
    client.emit('server:error', {
      code: response.response?.code ?? 'CHAT_ERROR',
      message: response.response?.message ?? response.message ?? 'Chat xatosi',
    });
  }
}

function roomName(roomId: string): string {
  return `chat:${roomId}`;
}

function bearerToken(value: string | undefined): string | undefined {
  return value?.startsWith('Bearer ') ? value.slice('Bearer '.length) : value;
}

function firstString(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
