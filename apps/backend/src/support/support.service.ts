import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@safaar/types';
import { randomUUID } from 'node:crypto';
import type { RequestActor } from '../common/actor';
import { PostgresService } from '../infrastructure/postgres.service';
import { EventsService } from '../realtime/events.service';

@Injectable()
export class SupportService {
  constructor(
    private readonly pg: PostgresService,
    private readonly events: EventsService,
  ) {}

  async create(actor: RequestActor | undefined, body: Record<string, unknown>) {
    const a = this.requireActor(actor);
    const now = new Date().toISOString();
    const id = randomUUID();
    const actorType = a.actorType === 'partner' ? 'partner' : 'user';
    const userId = actorType === 'user' ? a.id : null;
    const actorId = actorType === 'partner' ? (a.organizationId ?? a.id) : a.id;

    const [ticket] = await this.pg.query(
      `INSERT INTO support_tickets (id, user_id, actor_type, actor_id, subject, priority, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        userId,
        actorType,
        actorId,
        String(body.subject ?? ''),
        String(body.priority ?? 'medium'),
        'open',
        now,
        now,
      ],
    );

    this.events.supportTicketUpdated(ticket);
    return ticket;
  }

  async list(actor: RequestActor | undefined) {
    const a = this.requireActor(actor);
    const isPartner = a.actorType === 'partner';

    if (isPartner) {
      const tickets = await this.pg.query(
        `SELECT *
         FROM support_tickets
         WHERE actor_type = 'partner'
           AND actor_id = ANY($1::uuid[])
         ORDER BY created_at DESC`,
        [[a.id, a.organizationId].filter(Boolean)],
      );
      return tickets;
    }

    const tickets = await this.pg.query(
      'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC',
      [a.id],
    );
    return tickets;
  }

  async findOne(actor: RequestActor | undefined, id: string) {
    const ticket = await this.assertTicket(actor, id);

    const messages = await this.pg.query(
      'SELECT * FROM support_messages WHERE ticket_id = $1 ORDER BY created_at ASC',
      [id],
    );

    return {
      ...ticket,
      messages,
    };
  }

  async message(
    actor: RequestActor | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    await this.assertTicket(actor, id);
    const a = this.requireActor(actor);
    const now = new Date().toISOString();
    const messageId = randomUUID();

    const senderType =
      a.actorType === 'partner'
        ? 'partner'
        : a.actorType === 'admin'
          ? 'admin'
          : 'user';

    const [message] = await this.pg.query(
      `INSERT INTO support_messages (id, ticket_id, sender_type, sender_id, body, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [messageId, id, senderType, a.id, String(body.body ?? ''), now],
    );

    // Fetch ticket for broadcast context
    const [ticket] = await this.pg.query(
      'SELECT * FROM support_tickets WHERE id = $1',
      [id],
    );
    this.events.supportMessageCreated(id, message, ticket ?? { id });
    return message;
  }

  async status(
    actor: RequestActor | undefined,
    id: string,
    status: 'open' | 'closed',
  ) {
    await this.assertTicket(actor, id);
    const now = new Date().toISOString();

    const [ticket] = await this.pg.query(
      `UPDATE support_tickets
       SET status = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [status, now, id],
    );

    this.events.supportTicketUpdated(ticket);
    return ticket;
  }

  private async assertTicket(actor: RequestActor | undefined, id: string) {
    const a = this.requireActor(actor);

    const [ticket] = await this.pg.query(
      'SELECT * FROM support_tickets WHERE id = $1',
      [id],
    );

    if (!ticket) {
      throw new NotFoundException({
        code: 'VALIDATION_ERROR',
        message: 'Ticket topilmadi',
      });
    }

    // Admin / super_admin can access any ticket
    if (a.role === Role.SUPER_ADMIN || a.actorType === 'admin') {
      return ticket;
    }

    // User ownership check
    if (ticket.user_id && ticket.user_id === a.id) {
      return ticket;
    }

    // Partner ownership check
    const partnerActorIds = [a.id, a.organizationId].filter(Boolean);
    if (
      ticket.actor_type === 'partner' &&
      partnerActorIds.includes(String(ticket.actor_id))
    ) {
      return ticket;
    }

    throw new ForbiddenException({
      code: 'SUPPORT_FORBIDDEN',
      message: 'Bu ticket sizga tegishli emas',
    });
  }

  private requireActor(actor: RequestActor | undefined): RequestActor {
    if (!actor) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Sessiya topilmadi yoki token yaroqsiz',
      });
    }
    return actor;
  }
}
