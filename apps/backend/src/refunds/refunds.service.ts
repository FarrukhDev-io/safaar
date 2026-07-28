import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RequestActor } from '../common/actor';
import { PostgresService } from '../infrastructure/postgres.service';

interface RefundBookingRow {
  id: string;
  user_id: string;
  total_amount: string | number;
  currency: string;
}

type RefundRow = Record<string, unknown>;

@Injectable()
export class RefundsService {
  constructor(private readonly pg: PostgresService) {}

  async create(actor: RequestActor | undefined, body: Record<string, unknown>) {
    const currentActor = this.requireActor(actor);
    const bookingId = String(body.booking_id ?? '');
    const [booking] = await this.pg.query<RefundBookingRow>(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId],
    );
    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_EXPIRED',
        message: 'Bron topilmadi',
      });
    }
    if (booking.user_id !== currentActor.id) {
      throw new ForbiddenException({
        code: 'BOOKING_FORBIDDEN',
        message: 'Bu bron sizga tegishli emas',
      });
    }

    const [existing] = await this.pg.query<RefundRow>(
      "SELECT * FROM refunds WHERE booking_id = $1 AND user_id = $2 AND status != 'rejected'",
      [bookingId, currentActor.id],
    );
    if (existing) {
      return existing;
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const requestedAmount = Math.round(Number(booking.total_amount) * 0.8);
    const reason = String(body.reason ?? '');
    await this.pg.query(
      `INSERT INTO refunds (id, booking_id, user_id, status, currency, requested_amount, reason, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        bookingId,
        currentActor.id,
        'requested',
        booking.currency,
        requestedAmount,
        reason,
        now,
        now,
      ],
    );
    return {
      id,
      booking_id: bookingId,
      user_id: currentActor.id,
      status: 'requested',
      currency: booking.currency,
      requested_amount: requestedAmount,
      reason,
      created_at: now,
      updated_at: now,
    };
  }

  async findOne(actor: RequestActor | undefined, id: string) {
    const currentActor = this.requireActor(actor);
    const [refund] = await this.pg.query<RefundRow>(
      'SELECT * FROM refunds WHERE id = $1',
      [id],
    );
    if (!refund) {
      throw new NotFoundException({
        code: 'REFUND_NOT_ALLOWED',
        message: 'Refund topilmadi',
      });
    }
    if (
      currentActor.actorType === 'user' &&
      refund['user_id'] !== currentActor.id
    ) {
      throw new ForbiddenException({
        code: 'REFUND_FORBIDDEN',
        message: 'Bu refund sizga tegishli emas',
      });
    }
    return refund;
  }

  async mine(actor: RequestActor | undefined) {
    const currentActor = this.requireActor(actor);
    return this.pg.query('SELECT * FROM refunds WHERE user_id = $1', [
      currentActor.id,
    ]);
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
