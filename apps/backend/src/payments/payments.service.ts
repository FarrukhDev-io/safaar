import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { PostgresService } from '../infrastructure/postgres.service';
import {
  hmacSha256,
  paymentWebhookSecret,
  timingSafeEqualString,
} from '../auth/security';

type HeaderMap = Record<string, string | string[] | undefined>;

interface BookingVisibilityRow {
  id: string;
  user_id: string;
  partner_organization_id: string;
  total_amount: string | number;
  currency: string;
}

export interface PaymentRow {
  id: string;
  booking_id: string;
  amount: string | number;
  currency: string;
  status?: string;
  provider_reference?: string | null;
  updated_at?: string;
  [key: string]: unknown;
}

interface PaymentEventRow {
  payment_id?: string | null;
  processed_at?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly pg: PostgresService) {}

  async payment(actor: RequestActor | undefined, bookingId: string) {
    await this.assertBookingVisible(actor, bookingId);
    const [payment] = await this.pg.query<PaymentRow>(
      'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1',
      [bookingId],
    );
    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_PROVIDER_ERROR',
        message: 'Payment topilmadi',
      });
    }
    return payment;
  }

  async createPayment(
    actor: RequestActor | undefined,
    bookingId: string,
    body: Record<string, unknown>,
  ) {
    const booking = await this.assertBookingVisible(actor, bookingId);
    const provider = this.provider(body.provider);
    const id = randomUUID();
    const now = new Date().toISOString();
    await this.pg.query(
      `INSERT INTO payments (id, booking_id, provider, status, amount, currency, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        booking.id,
        provider,
        'pending',
        booking.total_amount,
        booking.currency,
        now,
        now,
      ],
    );
    return {
      id,
      booking_id: booking.id,
      provider,
      status: 'pending',
      amount: Number(booking.total_amount),
      currency: booking.currency,
      created_at: now,
      updated_at: now,
    };
  }

  async providerWebhook(
    provider: string,
    event: string,
    body: Record<string, unknown>,
    headers: HeaderMap = {},
  ) {
    const secret = this.requiredWebhookSecret();
    const eventKey = this.eventKey(provider, event, body);
    this.verifySignature(provider, event, eventKey, body, headers, secret);

    const payloadHash = hmacSha256(this.stableStringify(body), secret);

    const [existingEvent] = await this.pg.query<PaymentEventRow>(
      'SELECT * FROM payment_events WHERE event_key = $1',
      [eventKey],
    );
    if (existingEvent) {
      const payment = existingEvent.payment_id
        ? (
            await this.pg.query<PaymentRow>(
              'SELECT * FROM payments WHERE id = $1',
              [existingEvent.payment_id],
            )
          )[0]
        : undefined;
      return {
        provider,
        event,
        accepted: true,
        duplicate: true,
        payment,
        processed_at: existingEvent.processed_at,
      };
    }

    const bookingId = String(
      body.booking_id ?? body.bookingId ?? body.account ?? '',
    );
    const paymentRows = bookingId
      ? await this.pg.query<PaymentRow>(
          'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1',
          [bookingId],
        )
      : [];
    const [payment] = paymentRows;

    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_NOT_FOUND',
        message: 'Webhook uchun payment topilmadi',
      });
    }

    this.assertPaymentMatchesPayload(payment, body);

    const now = new Date().toISOString();
    const newStatus = event === 'prepare' ? 'processing' : 'paid';
    const providerReference = String(
      body.transaction_id ?? body.id ?? eventKey,
    );

    await this.pg.query(
      'UPDATE payments SET status = $1, provider_reference = $2, updated_at = $3 WHERE id = $4',
      [newStatus, providerReference, now, payment.id],
    );

    const processedAt = new Date().toISOString();
    await this.pg.query(
      `INSERT INTO payment_events (id, provider, event_type, event_key, payload, payload_hash, payment_id, processed_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)`,
      [
        randomUUID(),
        provider,
        event,
        eventKey,
        JSON.stringify(body),
        payloadHash,
        payment.id,
        processedAt,
      ],
    );

    return {
      provider,
      event,
      accepted: true,
      duplicate: false,
      payment: {
        ...payment,
        status: newStatus,
        provider_reference: providerReference,
        updated_at: now,
      },
      processed_at: processedAt,
    };
  }

  private async assertBookingVisible(
    actor: RequestActor | undefined,
    bookingId: string,
  ) {
    const [booking] = await this.pg.query<BookingVisibilityRow>(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId],
    );
    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_EXPIRED',
        message: 'Bron topilmadi',
      });
    }
    if (
      !actor ||
      actor.role === Role.SUPER_ADMIN ||
      actor.actorType === 'admin'
    ) {
      return booking;
    }
    if (actor.actorType === 'user' && booking.user_id === actor.id) {
      return booking;
    }
    if (
      actor.actorType === 'partner' &&
      booking.partner_organization_id === actor.organizationId
    ) {
      return booking;
    }
    throw new ForbiddenException({
      code: 'BOOKING_FORBIDDEN',
      message: 'Bu bron sizga tegishli emas',
    });
  }

  private verifySignature(
    provider: string,
    event: string,
    eventKey: string,
    body: Record<string, unknown>,
    headers: HeaderMap,
    secret: string,
  ) {
    const signature = this.firstHeader(
      headers['x-uzbron-signature'] ?? headers['x-signature'],
    );
    if (!signature) {
      throw new UnauthorizedException({
        code: 'PAYMENT_SIGNATURE_INVALID',
        message: 'Webhook signature yuborilmagan',
      });
    }
    const canonical = `${provider}.${event}.${eventKey}.${this.stableStringify(body)}`;
    const expected = hmacSha256(canonical, secret);
    if (!timingSafeEqualString(signature, expected)) {
      throw new UnauthorizedException({
        code: 'PAYMENT_SIGNATURE_INVALID',
        message: 'Webhook signature noto\u2018g\u2018ri',
      });
    }
  }

  private requiredWebhookSecret(): string {
    const secret = paymentWebhookSecret();
    if (!secret) {
      throw new ServiceUnavailableException({
        code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
        message: 'Payment provider rasmiy webhook integratsiyasi ulanmagan',
      });
    }
    return secret;
  }

  private eventKey(
    provider: string,
    event: string,
    body: Record<string, unknown>,
  ): string {
    const value =
      body.event_id ??
      body.eventId ??
      body.transaction_id ??
      body.id ??
      body.booking_id ??
      body.bookingId;
    return `${provider}:${event}:${String(value ?? '')}`;
  }

  private assertPaymentMatchesPayload(
    payment: Record<string, unknown>,
    body: Record<string, unknown>,
  ) {
    const amount = body.amount ?? body.total_amount;
    if (amount !== undefined && Number(amount) !== Number(payment.amount)) {
      throw new UnprocessableEntityException({
        code: 'PAYMENT_AMOUNT_MISMATCH',
        message: 'Webhook summasi payment bilan mos emas',
      });
    }
    const currency = body.currency
      ? String(body.currency).toUpperCase()
      : 'UZS';
    if (currency !== payment.currency) {
      throw new UnprocessableEntityException({
        code: 'PAYMENT_CURRENCY_MISMATCH',
        message: 'Webhook valyutasi payment bilan mos emas',
      });
    }
  }

  private stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      return `{${Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(
          ([key, entry]) =>
            `${JSON.stringify(key)}:${this.stableStringify(entry)}`,
        )
        .join(',')}}`;
    }
    return JSON.stringify(value);
  }

  private firstHeader(
    value: string | string[] | undefined,
  ): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }

  private provider(value: unknown): string {
    const provider = String(value ?? 'click');
    return ['click', 'payme', 'uzcard', 'humo', 'cash'].includes(provider)
      ? provider
      : 'click';
  }
}
