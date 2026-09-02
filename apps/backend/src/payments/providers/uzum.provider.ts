import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqualString } from '../../auth/security';

/**
 * Uzum Bank Merchant API adapteri — rasmiy contract:
 * https://developer.uzumbank.uz (Merchant API 1.0.0).
 *
 * Uzum bizga 5 ta webhook yuboradi (HTTPS POST JSON, HTTP Basic Auth):
 *   /check  /create  /confirm  /reverse  /status
 *
 * MUHIM farqlar (Click bilan aralashtirmaslik uchun):
 *  - Muvaffaqiyat = HTTP 200, biznes-xato = HTTP 400 (Click doim 200).
 *  - Xato javob AYNAN `{ serviceId, status: "FAILED", errorCode: "<string>" }`
 *    — `errorMessage` YO'Q, `errorCode` STRING.
 *  - `amount` — TIYIN. SAFAAR ichida esa so'm (`Decimal(18,2)`).
 *  - Checkout/redirect YO'Q — foydalanuvchi to'lovni Uzum ilovasidan boshlaydi.
 *  - `transId` — UUID; `serviceId` — int64 (JS precision uchun STRING sifatida solishtiramiz).
 *
 * Bu klass FAQAT Uzum-ga xos toza logikani ushlaydi (ClickProvider kabi):
 * Basic Auth tekshiruvi, serviceId tekshiruvi, tiyin↔so'm konvertatsiyasi,
 * error-code konstantalari va javob quruvchilar. Payment domen logikasi
 * `PaymentsService` ichida qoladi (Click uchun `clickPrepare/clickComplete`
 * qanday bo'lsa, Uzum uchun `uzumCheck/uzumCreate/...` shunday).
 */

/** Rasmiy Uzum Merchant API error-code jadvali (qiymatlar string). */
export const UZUM_ERROR = {
  /** 10001 — Доступ запрещён (авторизация). */
  AUTH: '10001',
  /** 10002 — Ошибка парсинга JSON / структура не соответствует. */
  BAD_JSON: '10002',
  /** 10003 — Недопустимая операция (ожидается POST / неизвестный метод). */
  INVALID_OPERATION: '10003',
  /** 10005 — Отсутствуют обязательные параметры (пустые/нет). */
  MISSING_PARAMS: '10005',
  /** 10006 — Неверный serviceId. */
  INVALID_SERVICE_ID: '10006',
  /** 10007 — Дополнительный атрибут платежа не найден (напр. account). */
  ACCOUNT_NOT_FOUND: '10007',
  /** 10008 — Платёж уже оплачен. */
  ALREADY_PAID: '10008',
  /** 10009 — Платёж отменён. */
  CANCELLED: '10009',
  /** 10010 — Транзакция с этим transId уже создана. */
  ALREADY_CREATED: '10010',
  /** 10011 — Неверная сумма. */
  INVALID_AMOUNT: '10011',
  /** 10012 — Сумма ниже минимальной. */
  AMOUNT_BELOW_MIN: '10012',
  /** 10013 — Сумма превышает максимальную. */
  AMOUNT_ABOVE_MAX: '10013',
  /** 10014 — Транзакция не найдена. */
  TRANS_NOT_FOUND: '10014',
  /** 10015 — Транзакция отменена — нельзя подтвердить. */
  TRANS_CANCELLED: '10015',
  /** 10016 — Транзакция с этим transId уже подтверждена. */
  ALREADY_CONFIRMED: '10016',
  /** 10017 — Невозможно отменить транзакцию в текущем состоянии. */
  CANNOT_REVERSE: '10017',
  /** 10018 — Транзакция с этим transId уже отменена. */
  ALREADY_REVERSED: '10018',
  /** 99999 — Внутренняя ошибка сервера. */
  INTERNAL: '99999',
} as const;

export type UzumErrorCode = (typeof UZUM_ERROR)[keyof typeof UZUM_ERROR];

/** Uzum javob statuslari (rasmiy). */
export const UZUM_STATUS = {
  OK: 'OK',
  CREATED: 'CREATED',
  CONFIRMED: 'CONFIRMED',
  REVERSED: 'REVERSED',
  FAILED: 'FAILED',
} as const;

/**
 * Uzum webhookini muvaffaqiyatsiz yakunlaydigan biznes-xato.
 * Controller uni tutib, HTTP 400 + `{ serviceId, status: "FAILED", errorCode }`
 * qaytaradi.
 */
export class UzumWebhookError extends Error {
  constructor(
    public readonly errorCode: UzumErrorCode,
    public readonly serviceId: unknown = null,
  ) {
    super(`UZUM_${errorCode}`);
    this.name = 'UzumWebhookError';
  }
}

@Injectable()
export class UzumProvider {
  private readonly serviceId?: string;
  private readonly username?: string;
  private readonly password?: string;

  constructor(config: ConfigService) {
    this.serviceId = config.get<string>('UZUM_SERVICE_ID');
    this.username = config.get<string>('UZUM_USERNAME');
    this.password = config.get<string>('UZUM_PASSWORD');
  }

  isConfigured(): boolean {
    return Boolean(this.serviceId && this.username && this.password);
  }

  /**
   * `Authorization: Basic base64(login:password)` sarlavhasini tekshiradi.
   * Muvaffaqiyatsiz bo'lsa `UzumWebhookError('10001')` tashlaydi.
   * Solishtirish doimiy vaqtda (`timingSafeEqualString`).
   */
  assertBasicAuth(authorizationHeader: string | undefined): void {
    if (!this.isConfigured()) {
      // Credential umuman sozlanmagan — hech qanday so'rovni qabul qilmaymiz.
      throw new UzumWebhookError(UZUM_ERROR.AUTH);
    }
    const raw = (authorizationHeader ?? '').trim();
    const spaceIdx = raw.indexOf(' ');
    const scheme = spaceIdx > 0 ? raw.slice(0, spaceIdx) : '';
    const encoded = spaceIdx > 0 ? raw.slice(spaceIdx + 1).trim() : '';
    if (scheme.toLowerCase() !== 'basic' || !encoded) {
      throw new UzumWebhookError(UZUM_ERROR.AUTH);
    }
    let decoded: string;
    try {
      decoded = Buffer.from(encoded, 'base64').toString('utf8');
    } catch {
      throw new UzumWebhookError(UZUM_ERROR.AUTH);
    }
    const sep = decoded.indexOf(':');
    if (sep < 0) {
      throw new UzumWebhookError(UZUM_ERROR.AUTH);
    }
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    const okUser = timingSafeEqualString(user, this.username as string);
    const okPass = timingSafeEqualString(pass, this.password as string);
    if (!okUser || !okPass) {
      throw new UzumWebhookError(UZUM_ERROR.AUTH);
    }
  }

  /**
   * `serviceId`ni sozlangan qiymat bilan solishtiradi. int64 → JS number
   * aniqligini yo'qotmaslik uchun STRING sifatida solishtiramiz.
   * Kelgan qiymatni (echo uchun) o'zgartirmasdan qaytaramiz.
   */
  assertServiceId(received: unknown): unknown {
    if (received === undefined || received === null || received === '') {
      throw new UzumWebhookError(UZUM_ERROR.MISSING_PARAMS, received);
    }
    if (String(received).trim() !== String(this.serviceId).trim()) {
      throw new UzumWebhookError(UZUM_ERROR.INVALID_SERVICE_ID, received);
    }
    return received;
  }

  /** So'm (Decimal string/number) → tiyin (butun son). */
  toTiyin(som: number | string): number {
    return Math.round(Number(som) * 100);
  }

  // --- Javob quruvchilar (rasmiy contract shakli) ---

  checkOk(serviceId: unknown, data: Record<string, unknown> = {}) {
    return {
      serviceId,
      timestamp: Date.now(),
      status: UZUM_STATUS.OK,
      data,
    };
  }

  created(
    serviceId: unknown,
    transId: string,
    amountTiyin: number,
    data: Record<string, unknown> = {},
  ) {
    return {
      serviceId,
      transId,
      status: UZUM_STATUS.CREATED,
      transTime: Date.now(),
      data,
      amount: amountTiyin,
    };
  }

  confirmed(
    serviceId: unknown,
    transId: string,
    amountTiyin: number,
    data: Record<string, unknown> = {},
  ) {
    return {
      serviceId,
      transId,
      status: UZUM_STATUS.CONFIRMED,
      confirmTime: Date.now(),
      data,
      amount: amountTiyin,
    };
  }

  reversed(
    serviceId: unknown,
    transId: string,
    amountTiyin: number,
    data: Record<string, unknown> = {},
  ) {
    return {
      serviceId,
      transId,
      status: UZUM_STATUS.REVERSED,
      reverseTime: Date.now(),
      data,
      amount: amountTiyin,
    };
  }

  statusResult(
    serviceId: unknown,
    transId: string,
    status: string,
    times: {
      transTime?: number | null;
      confirmTime?: number | null;
      reverseTime?: number | null;
    },
    amountTiyin: number,
    data: Record<string, unknown> = {},
  ) {
    return {
      serviceId,
      transId,
      status,
      transTime: times.transTime ?? null,
      confirmTime: times.confirmTime ?? null,
      reverseTime: times.reverseTime ?? null,
      data,
      amount: amountTiyin,
    };
  }

  /** HTTP 400 uchun xato tanasi — AYNAN contractdagi shakl. */
  errorBody(serviceId: unknown, errorCode: string) {
    return {
      serviceId: serviceId ?? null,
      status: UZUM_STATUS.FAILED,
      errorCode,
    };
  }
}
