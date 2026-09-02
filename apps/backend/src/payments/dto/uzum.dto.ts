/**
 * Uzum Merchant API webhook request shakllari (rasmiy contract).
 *
 * QASDDAN `class-validator` dekoratorlarisiz — global `ValidationPipe`
 * (`whitelist` + `forbidNonWhitelisted`) Uzum yuboradigan maydonlarni
 * (`paymentSource`, `tariff`, `cardType`, erkin `params` obyekti, ...) rad
 * etib qo'yardi; bu esa contractdagi aniq `errorCode` (10002 / 10005)
 * o'rniga umumiy 400 qaytishiga olib kelardi. Shu sabab controller
 * `@Body() Record<string, unknown>` qabul qiladi (Click/Payme webhooklari
 * kabi), maydonlar `PaymentsService` ichida qo'lda o'qiladi va tekshiriladi
 * (`UzumProvider` error-code'lari bilan). Bu interfeyslar faqat tiplash va
 * hujjatlash uchun.
 */

/** `params` ichidagi kalitlar onboarding'da Uzum bilan kelishiladi. */
export interface UzumParams {
  /** SAFAAR qarori: `account` = `bookings.booking_number`. */
  account?: string;
  [key: string]: unknown;
}

export interface UzumCheckDto {
  serviceId: number | string;
  timestamp: number;
  params: UzumParams;
}

export interface UzumCreateDto {
  serviceId: number | string;
  timestamp: number;
  transId: string; // UUID
  params: UzumParams;
  amount: number; // TIYIN
}

export interface UzumConfirmDto {
  serviceId: number | string;
  timestamp: number;
  transId: string; // UUID
  paymentSource: string;
  tariff?: string | null;
  processingReferenceNumber?: string | null;
  phone: string;
  cardType?: number | null;
}

export interface UzumReverseDto {
  serviceId: number | string;
  timestamp: number;
  transId: string; // UUID
}

export interface UzumStatusDto {
  serviceId: number | string;
  timestamp: number;
  transId: string; // UUID
}
