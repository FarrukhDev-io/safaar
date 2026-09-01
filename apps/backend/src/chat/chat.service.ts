import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { PostgresService } from '../infrastructure/postgres.service';

export interface ChatRoomRow {
  id: string;
  user_id: string;
  status: 'OPEN' | 'RESOLVED';
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ChatMessageRow {
  id: string;
  room_id: string;
  sender_id: string;
  sender_type: 'user' | 'operator';
  text: string;
  read_at: Date | string | null;
  created_at: Date | string;
}

@Injectable()
export class ChatService {
  constructor(private readonly pg: PostgresService) {}

  async roomForJoin(actor: RequestActor, roomId: string | undefined) {
    const normalizedRoomId = roomId?.trim();
    if (!normalizedRoomId || normalizedRoomId === 'current') {
      if (actor.actorType !== 'user') {
        throw new BadRequestException({
          code: 'CHAT_ROOM_ID_REQUIRED',
          message: 'Operator uchun roomId yuborilishi kerak',
        });
      }
      return this.findOrCreateUserRoom(actor.id);
    }

    return this.assertRoomAccess(actor, normalizedRoomId);
  }

  async sendMessage(actor: RequestActor, roomId: string, text: string) {
    const room = await this.assertRoomAccess(actor, roomId);
    if (room.status === 'RESOLVED') {
      throw new ForbiddenException({
        code: 'CHAT_ROOM_RESOLVED',
        message: 'Yopilgan chatga xabar yuborib bo‘lmaydi',
      });
    }

    const cleanText = text.trim();
    if (!cleanText) {
      throw new BadRequestException({
        code: 'CHAT_MESSAGE_EMPTY',
        message: 'Xabar matni bo‘sh bo‘lmasligi kerak',
      });
    }

    const now = new Date().toISOString();
    const [message] = await this.pg.query<ChatMessageRow>(
      `INSERT INTO chat_messages
         (id, room_id, sender_id, sender_type, text, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id::text, room_id::text, sender_id::text,
         sender_type::text, text, read_at, created_at`,
      [
        randomUUID(),
        room.id,
        actor.id,
        actor.actorType === 'user' ? 'user' : 'operator',
        cleanText.slice(0, 4000),
        now,
      ],
    );

    await this.pg.query('UPDATE chat_rooms SET updated_at = $1 WHERE id = $2', [
      now,
      room.id,
    ]);

    return this.toSocketMessage(message);
  }

  async assertRoomAccess(actor: RequestActor, roomId: string) {
    const [room] = await this.pg.query<ChatRoomRow>(
      `SELECT id::text, user_id::text, status::text, created_at, updated_at
       FROM chat_rooms
       WHERE id = $1`,
      [roomId],
    );

    if (!room) {
      throw new NotFoundException({
        code: 'CHAT_ROOM_NOT_FOUND',
        message: 'Chat xonasi topilmadi',
      });
    }

    // `chat_rooms`da tashkilot/tenant chegarasini ifodalovchi ustun
    // UMUMAN YO'Q (faqat `id, user_id, status, created_at, updated_at`) —
    // shuning uchun "faqat shu hamkorga tegishli xonalar" kabi to'g'ri
    // scoping'ni hozircha DB darajasida qurib bo'lmaydi (PHASE 14F/14G
    // auditda aniqlangan). Shu sabab bu yerda aniq RUXSAT RO'YXATI
    // (allow-list) ishlatiladi — kimga ruxsat berilishi HAR DOIM aniq
    // yozilgan, "boshqa hamma narsaga ruxsat" degan implicit holat yo'q:
    //   - 'user': faqat o'ziga tegishli xona
    //   - 'admin' / SUPER_ADMIN: umumiy support-navbat operatori sifatida
    //     istalgan xonaga (mahsulot qarori — markazlashtirilgan support)
    //   - 'partner': HOZIRCHA RAD ETILADI — chunki xonani biror hamkor
    //     tashkilotiga bog'lash uchun schema'da hech qanday ustun yo'q,
    //     shuning uchun "faqat o'z tashkilotiga tegishli" tekshiruvini
    //     xavfsiz amalga oshirib bo'lmaydi. (Bu funksiya frontend
    //     tomonidan hozircha umuman chaqirilmaydi — tasdiqlangan, PHASE 14F
    //     — shuning uchun bu cheklov birorta ham mavjud oqimni buzmaydi.)
    //     Agar kelajakda hamkorlarga umumiy support-chat kerak bo'lsa,
    //     avval `chat_rooms`ga tegishli scoping ustuni/relatsiyasi
    //     (schema migration) qo'shilishi kerak.
    const isOwner = actor.actorType === 'user' && room.user_id === actor.id;
    const isAdminOperator =
      actor.actorType === 'admin' || actor.role === Role.SUPER_ADMIN;

    if (!isOwner && !isAdminOperator) {
      throw new ForbiddenException({
        code: 'CHAT_ROOM_FORBIDDEN',
        message: 'Bu chat xonasi sizga tegishli emas',
      });
    }

    return room;
  }

  toSocketMessage(message: ChatMessageRow) {
    return {
      id: message.id,
      roomId: message.room_id,
      senderId: message.sender_id,
      senderType: message.sender_type,
      text: message.text,
      createdAt: new Date(message.created_at).toISOString(),
    };
  }

  isOperator(actor: RequestActor): boolean {
    return (
      actor.actorType === 'admin' ||
      actor.actorType === 'partner' ||
      actor.role === Role.SUPER_ADMIN ||
      actor.role === Role.SUPPORT_ADMIN
    );
  }

  private async findOrCreateUserRoom(userId: string) {
    const [existing] = await this.pg.query<ChatRoomRow>(
      `SELECT id::text, user_id::text, status::text, created_at, updated_at
       FROM chat_rooms
       WHERE user_id = $1 AND status = 'OPEN'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const [created] = await this.pg.query<ChatRoomRow>(
      `INSERT INTO chat_rooms (id, user_id, status, created_at, updated_at)
       VALUES ($1, $2, 'OPEN', $3, $3)
       RETURNING id::text, user_id::text, status::text, created_at, updated_at`,
      [randomUUID(), userId, now],
    );
    return created;
  }
}
