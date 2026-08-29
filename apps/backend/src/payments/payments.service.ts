import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import {
  PostgresService,
  type PostgresTransaction,
} from '../infrastructure/postgres.service';
import {
  hmacSha256,
  paymentWebhookSecret,
  timingSafeEqualString,
} from '../auth/security';
import {
  CLICK_ERROR,
  ClickProvider,
  type ClickCompleteBody,
  type ClickPrepareBody,
} from './providers/click.provider';
import { PaymeProvider } from './providers/payme.provider';

type HeaderMap = Record<string, string | string[] | undefined>;

/**
 * DB-level booking status konstantalari (kichik harf, pg enum'iga mos) —
 * `bookings.service.ts`dagi bilan bir xil, lekin qasddan mustaqil
 * nusxada — ikkala modul o'zaro bog'liq bo'lib qolmasligi uchun.
 */
const BS = {
  PENDING: BookingStatus.PENDING.toLowerCase(),
  AWAITING_PAYMENT: BookingStatus.AWAITING_PAYMENT.toLowerCase(),
  AWAITING_PARTNER_CONFIRMATION:
    BookingStatus.AWAITING_PARTNER_CONFIRMATION.toLowerCase(),
  CONFIRMED: BookingStatus.CONFIRMED.toLowerCase(),
  CANCELLED: BookingStatus.CANCELLED.toLowerCase(),
  COMPLETED: BookingStatus.COMPLETED.toLowerCase(),
  EXPIRED: BookingStatus.EXPIRED.toLowerCase(),
} as const;

const OPEN_BOOKING_STATUSES = [BS.PENDING, BS.AWAITING_PAYMENT];
const SETTLED_BOOKING_STATUSES = [BS.EXPIRED, BS.CANCELLED];

interface BookingVisibilityRow {
  id: string;
  user_id: string | null;
  partner_organization_id: string;
  total_amount: string | number;
  currency: string;
}

interface BookingRow {
  id: string;
  status: string;
  user_id: string | null;
  partner_organization_id: string;
  confirmation_mode: string;
  partner_payable: string | number;
  currency: string;
  [key: string]: unknown;
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
  id: string;
  payment_id?: string | null;
  processed_at?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly pg: PostgresService,
    private readonly config: ConfigService,
    private readonly click: ClickProvider,
    private readonly payme: PaymeProvider,
  ) {}

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

    // Shu bron uchun hali natijasi chiqmagan (pending/processing) payment
    // bo'lsa — yangisini yaratmasdan o'shani qaytaramiz. Aks holda har bir
    // "Qayta urinish"/checkout'ni qayta ochish bir xil bronga bir nechta
    // mustaqil payment qatori yaratardi, va webhook keyinchalik qaysi
    // birini "to'landi" deb belgilashni noaniq tanlashga majbur bo'lardi.
    const [existing] = await this.pg.query<PaymentRow>(
      `SELECT * FROM payments
       WHERE booking_id = $1 AND status IN ('pending', 'processing')
       ORDER BY created_at DESC
       LIMIT 1`,
      [booking.id],
    );
    if (existing) {
      return existing;
    }

    const provider = this.provider(body.provider);
    const id = randomUUID();
    const now = new Date().toISOString();
    const amount = Number(booking.total_amount);
    const paymentUrl = this.buildCheckoutUrl(provider, booking.id, amount);

    await this.pg.query(
      `INSERT INTO payments (id, booking_id, provider, status, amount, currency, payment_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        booking.id,
        provider,
        provider === 'cash' ? 'awaiting_cash' : 'pending',
        booking.total_amount,
        booking.currency,
        paymentUrl,
        now,
        now,
      ],
    );
    return {
      id,
      booking_id: booking.id,
      provider,
      status: 'pending',
      payment_url: paymentUrl,
      amount: Number(booking.total_amount),
      currency: booking.currency,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * `cash` uchun URL kerak emas — hamkor to'lovni joyida qabul qiladi.
   * Boshqa provayderlar uchun sozlanmagan bo'lsa, jim `null` qaytarish
   * o'rniga aniq xato tashlaymiz — aks holda frontend "to'lov kutilmoqda"
   * holatida abadiy qolib ketardi (aynan shu audit findingi).
   */
  buildCheckoutUrl(
    provider: string,
    bookingId: string,
    amount: number,
  ): string | null {
    if (provider === 'cash') {
      return null;
    }

    const returnUrl = `${this.webUserUrl()}/booking/${bookingId}`;

    if (provider === 'click') {
      if (!this.click.isConfigured()) {
        throw new ServiceUnavailableException({
          code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
          message:
            'Click to‘lov provayderi sozlanmagan (CLICK_SERVICE_ID/CLICK_MERCHANT_ID/CLICK_SECRET_KEY)',
        });
      }
      return this.click.buildCheckoutUrl({ bookingId, amount, returnUrl });
    }

    if (provider === 'payme') {
      if (!this.payme.isConfigured()) {
        throw new ServiceUnavailableException({
          code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
          message: 'Payme to‘lov provayderi sozlanmagan (PAYME_MERCHANT_ID)',
        });
      }
      return this.payme.buildCheckoutUrl({ bookingId, amount, returnUrl });
    }

    // uzcard/humo — hozircha checkout URL generatsiyasi qo'shilmagan
    // (real API/spec integratsiyasi kelajakdagi ish sifatida qoladi).
    throw new ServiceUnavailableException({
      code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
      message: `${provider} to‘lov provayderi hali ulanmagan`,
    });
  }

  private webUserUrl(): string {
    return (
      this.config.get<string>('WEB_USER_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  /**
   * Click'ning haqiqiy Prepare/Complete oqimi — https://docs.click.uz
   * Click bilan MUVOFIQLIK uchun javob HAR DOIM HTTP 200 bo'lishi shart,
   * xato bo'lsa ham (`error` maydonida manfiy kod bilan bildiriladi) —
   * aks holda Click cheksiz retry qilib turadi.
   */
  async clickPrepare(body: ClickPrepareBody) {
    if (!this.click.verifyPrepareSignature(body)) {
      return this.clickError(
        body,
        CLICK_ERROR.SIGN_CHECK_FAILED,
        'SIGN CHECK FAILED!',
      );
    }

    const bookingId = String(body.merchant_trans_id ?? '');
    const eventKey = `click:prepare:${body.click_trans_id}`;

    try {
      await this.processPaymentEvent('click', 'prepare', eventKey, {
        booking_id: bookingId,
        amount: body.amount,
        transaction_id: body.click_trans_id,
      });
      return {
        success: true as const,
        click_trans_id: body.click_trans_id,
        merchant_trans_id: bookingId,
        merchant_prepare_id: body.click_trans_id,
        error: CLICK_ERROR.SUCCESS,
        error_note: 'Success',
      };
    } catch (error) {
      return this.clickErrorFromException(body, error);
    }
  }

  async clickComplete(body: ClickCompleteBody) {
    if (!this.click.verifyCompleteSignature(body)) {
      return this.clickError(
        body,
        CLICK_ERROR.SIGN_CHECK_FAILED,
        'SIGN CHECK FAILED!',
      );
    }

    if (Number(body.error) < 0) {
      // Click o'zi bekor qilingan/muvaffaqiyatsiz to'lovni bildirmoqda —
      // bizning tomonimizda hech narsa "to'landi" deb belgilanmaydi.
      return {
        success: true as const,
        click_trans_id: body.click_trans_id,
        merchant_trans_id: body.merchant_trans_id,
        merchant_confirm_id: body.merchant_prepare_id,
        error: CLICK_ERROR.TRANSACTION_CANCELLED,
        error_note: 'Transaction cancelled',
      };
    }

    const bookingId = String(body.merchant_trans_id ?? '');
    const eventKey = `click:complete:${body.click_trans_id}`;

    try {
      await this.processPaymentEvent('click', 'complete', eventKey, {
        booking_id: bookingId,
        amount: body.amount,
        transaction_id: body.click_trans_id,
      });
      return {
        success: true as const,
        click_trans_id: body.click_trans_id,
        merchant_trans_id: bookingId,
        merchant_confirm_id: body.merchant_prepare_id,
        error: CLICK_ERROR.SUCCESS,
        error_note: 'Success',
      };
    } catch (error) {
      return this.clickErrorFromException(body, error);
    }
  }

  private clickError(body: ClickPrepareBody, error: number, errorNote: string) {
    return {
      success: true as const,
      click_trans_id: body.click_trans_id,
      merchant_trans_id: body.merchant_trans_id,
      error,
      error_note: errorNote,
    };
  }

  private clickErrorFromException(body: ClickPrepareBody, error: unknown) {
    const code =
      error instanceof NotFoundException
        ? CLICK_ERROR.TRANSACTION_NOT_FOUND
        : error instanceof UnprocessableEntityException
          ? CLICK_ERROR.INCORRECT_AMOUNT
          : CLICK_ERROR.ACTION_NOT_FOUND;
    const message =
      error instanceof Error ? error.message : 'Payment processing error';
    return this.clickError(body, code, message);
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

    return this.processPaymentEvent(provider, event, eventKey, body);
  }

  /**
   * `providerWebhook()`dan chiqarilgan umumiy tranzaksiya logikasi —
   * imzo allaqachon tekshirilgan bo'lishi shart, chunki bu yerda buni
   * qayta tekshirmaymiz. Click kabi provayderlar o'zining haqiqiy imzo
   * sxemasi bilan tekshirib, keyin shu metodni chaqiradi (`clickWebhook`).
   */
  private async processPaymentEvent(
    provider: string,
    event: string,
    eventKey: string,
    body: Record<string, unknown>,
  ) {
    // Bu yerdagi hash faqat audit/dedup uchun fingerprint — haqiqiy
    // xavfsizlik allaqachon (a) chaqiruvchi tomonidan bajarilgan imzo
    // tekshiruvi va (b) `event_key` ustidagi UNIQUE constraint orqali
    // ta'minlangan, shuning uchun bu yerga webhook secret kerak emas.
    const payloadHash = createHash('sha256')
      .update(this.stableStringify(body))
      .digest('hex');

    return this.pg.transaction(async (tx) => {
      // event_key ustidagi UNIQUE constraint + ON CONFLICT DO NOTHING —
      // bir xil webhook parallel/qayta kelsa ham faqat bitta so'rov uni
      // "yutib oladi", qolganlari 500 bermasdan duplicate:true qaytaradi.
      const claimed = await tx.query<PaymentEventRow>(
        `INSERT INTO payment_events (id, provider, event_type, event_key, payload, payload_hash, processed_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
         ON CONFLICT (event_key) DO NOTHING
         RETURNING *`,
        [
          randomUUID(),
          provider,
          event,
          eventKey,
          JSON.stringify(body),
          payloadHash,
          new Date().toISOString(),
        ],
      );

      if (claimed.length === 0) {
        const [existingEvent] = await tx.query<PaymentEventRow>(
          'SELECT * FROM payment_events WHERE event_key = $1',
          [eventKey],
        );
        const payment = existingEvent?.payment_id
          ? (
              await tx.query<PaymentRow>(
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
          processed_at: existingEvent?.processed_at,
        };
      }

      const eventRow = claimed[0];

      const bookingId = String(
        body.booking_id ?? body.bookingId ?? body.account ?? '',
      );

      // Bronni AVVAL, qulflab olamiz — aynan shu qulf `expireStaleBookings`
      // cron'i bilan haqiqiy o'zaro istisno (mutual exclusion) ta'minlaydi:
      // ikkalasi ham xuddi shu qatorga UPDATE qiladi, shuning uchun Postgres
      // ularni tabiiy ravishda ketma-ket, bittasi ikkinchisidan KEYIN
      // (yangilangan holatni ko'rib) bajaradi — "hozir ikkalasi ham
      // muvaffaqiyatli, natija board bo'lib qoladi" degan holat bo'lmaydi.
      const [booking] = bookingId
        ? await tx.query<BookingRow>(
            'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
            [bookingId],
          )
        : [];

      // To'lov qatorini tanlashda avval hali natijasi chiqmagan
      // (pending/processing)ni afzal ko'ramiz — bir bronga bir nechta
      // payment qatori bo'lib qolgan taqdirda ham (masalan eski, tugagan
      // urinish) webhook noto'g'ri/eskirgan qatorni "to'landi" deb
      // belgilab qo'ymasligi uchun.
      const paymentRows = bookingId
        ? await tx.query<PaymentRow>(
            `SELECT * FROM payments WHERE booking_id = $1
             ORDER BY (status IN ('pending', 'processing')) DESC, created_at DESC
             LIMIT 1 FOR UPDATE`,
            [bookingId],
          )
        : [];
      const [payment] = paymentRows;

      if (!payment || !booking) {
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

      await tx.query(
        'UPDATE payments SET status = $1, provider_reference = $2, updated_at = $3 WHERE id = $4',
        [newStatus, providerReference, now, payment.id],
      );

      await tx.query(
        'UPDATE payment_events SET payment_id = $1 WHERE id = $2',
        [payment.id, eventRow.id],
      );

      let bookingOutcome:
        | 'confirmed'
        | 'awaiting_partner_confirmation'
        | 'no_action'
        | 'lost_race_refund_requested' = 'no_action';

      if (newStatus === 'paid') {
        if (OPEN_BOOKING_STATUSES.includes(booking.status)) {
          // Kutilgan, oddiy holat: to'lov muddat tugashidan oldin yetib
          // keldi. Bron endi cron tomonidan "expired"ga o'tkazilmasligi
          // uchun `expires_at`ni ham shu yerda tozalaymiz.
          const nextStatus =
            booking.confirmation_mode === 'request_confirmation'
              ? BS.AWAITING_PARTNER_CONFIRMATION
              : BS.CONFIRMED;

          await tx.query(
            `UPDATE bookings
             SET status = $1, confirmed_at = $2, expires_at = NULL, updated_at = $2
             WHERE id = $3`,
            [nextStatus, now, booking.id],
          );
          await this.recordStatusHistory(
            tx,
            booking.id,
            nextStatus,
            'payment_paid',
          );
          await this.creditPartnerLedger(tx, booking);

          bookingOutcome =
            nextStatus === BS.CONFIRMED
              ? 'confirmed'
              : 'awaiting_partner_confirmation';
        } else if (SETTLED_BOOKING_STATUSES.includes(booking.status)) {
          // Poyga yutqazildi: pul haqiqatan keldi, lekin bron cron
          // tomonidan allaqachon "expired"/"cancelled" qilingan — xona/
          // o'rindiq boshqa mijozga qayta sotilgan bo'lishi mumkin, shuning
          // uchun bronni jim tasdiqlab bo'lmaydi. Pul esa hech qachon
          // "yo'qolib" ketmasligi kerak — shu sabab avtomatik refund
          // so'rovi ochiladi (admin navbatida ko'rinadi) va bu holat
          // bron tarixida aniq qayd etiladi.
          await this.recordStatusHistory(
            tx,
            booking.id,
            booking.status,
            'paid_after_settlement_auto_refund',
          );
          await this.autoRefundForLostRace(tx, booking, payment, now);
          bookingOutcome = 'lost_race_refund_requested';
        }
        // Boshqa holatlar (booking allaqachon confirmed/awaiting_partner_
        // confirmation/completed) — idempotentlik tufayli odatda bu yerga
        // yetib kelmaydi, lekin yetib kelsa ham qo'shimcha harakat
        // qilinmaydi (ikki marta kredit/tasdiqlashning oldi olinadi).
      }

      return {
        provider,
        event,
        accepted: true,
        duplicate: false,
        booking_outcome: bookingOutcome,
        payment: {
          ...payment,
          status: newStatus,
          provider_reference: providerReference,
          updated_at: now,
        },
        processed_at: eventRow.processed_at,
      };
    });
  }

  private async recordStatusHistory(
    tx: PostgresTransaction,
    bookingId: string,
    status: string,
    action: string,
  ) {
    await tx.query(
      `INSERT INTO booking_status_history (id, booking_id, status, action, actor_type, actor_id, created_at)
       VALUES ($1, $2, $3, $4, NULL, NULL, $5)`,
      [randomUUID(), bookingId, status, action, new Date().toISOString()],
    );
  }

  /**
   * Bron "topshirilgan" (to'lov qabul qilingan va hamkorga tasdiqlangan/
   * tasdiqlanishi so'ralgan) bo'lganda hamkorning haqiqiy hisobiga
   * (`partner_ledger_entries`) shu bron bo'yicha ulush qo'shiladi — bu
   * jadval endi hamkor balansi uchun YAGONA haqiqat manbai (avval balans
   * to'g'ridan-to'g'ri `bookings.total_amount`dan, holatidan qat'iy nazar,
   * hisoblab chiqilardi).
   */
  private async creditPartnerLedger(
    tx: PostgresTransaction,
    booking: BookingRow,
  ) {
    await tx.query(
      `INSERT INTO partner_ledger_entries (id, organization_id, booking_id, type, amount, currency, created_at)
       VALUES ($1, $2, $3, 'booking_earned', $4, $5, $6)`,
      [
        randomUUID(),
        booking.partner_organization_id,
        booking.id,
        Number(booking.partner_payable),
        booking.currency,
        new Date().toISOString(),
      ],
    );
  }

  /**
   * Pul kelgan, lekin bron allaqachon "expired"/"cancelled" bo'lib
   * qolgan holat uchun — avtomatik refund so'rovi. `requested_amount`
   * to'liq to'langan summa (mijoz aybi emas, tizim tomonidagi vaqt
   * poygasi), reason maydonida sabab aniq yozib qo'yiladi.
   */
  private async autoRefundForLostRace(
    tx: PostgresTransaction,
    booking: BookingRow,
    payment: PaymentRow,
    now: string,
  ) {
    await tx.query(
      `INSERT INTO refunds (id, booking_id, user_id, status, currency, requested_amount, reason, created_at, updated_at)
       VALUES ($1, $2, $3, 'requested', $4, $5, $6, $7, $7)`,
      [
        randomUUID(),
        booking.id,
        booking.user_id,
        payment.currency,
        Number(payment.amount),
        "Tizim: to'lov bron muddati tugagach/bekor qilingach yetib keldi — avtomatik qaytarish so'rovi",
        now,
      ],
    );
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
    if (!actor) {
      // Anonim (tokensiz) chaqiruv — bron egasini aniqlab bo'lmaydi.
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Sessiya topilmadi yoki token yaroqsiz',
      });
    }
    if (actor.role === Role.SUPER_ADMIN || actor.actorType === 'admin') {
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
      headers['x-safaar-signature'] ?? headers['x-signature'],
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
        // `undefined`-qiymatli kalitlar kanonik matnga umuman kirmasligi
        // kerak — aks holda ular JSON.stringify orqali so'zma-so'z
        // "undefined" matniga aylanadi, va real provayder (masalan Click)
        // yubormaydigan/bilmaydigan maydonlar imzoni buzib qo'yadi.
        .filter(([, entry]) => entry !== undefined)
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
