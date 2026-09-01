import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

/**
 * OTP/parol-tiklash so'rovlari uchun TELEFON RAQAMI bo'yicha qo'shimcha
 * cheklov — mavjud `@Throttle` (IP bo'yicha) bilan BIRGA ishlaydi, uni
 * almashtirmaydi. Maqsad: agar hujumchi ko'p IP (proksi/botnet) orqali
 * bitta qurbonning telefon raqamiga son-sanoqsiz SMS yuborsa (SMS-bombing),
 * IP-asosli limit buni ushlab qololmaydi — bu guard aynan shu bo'shliqni
 * yopadi.
 *
 * Xotira-ichi (in-memory), production hozircha BITTA backend instance
 * bo'lgani uchun bu yetarli (Phase 14B/14D'da tasdiqlangan topologiya).
 * Agar kelajakda gorizontal masshtablansa — Redis-backed storage'ga
 * o'tish kerak bo'ladi (bu yerda ataylab qilinmagan, minimal fix doirasi).
 */
@Injectable()
export class PhoneOtpThrottleGuard implements CanActivate {
  // <normalized phone> -> so'rov vaqtlari (ms, epoch)
  private readonly attempts = new Map<string, number[]>();

  private readonly limit = 5;
  private readonly windowMs = 10 * 60_000; // 10 daqiqa

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ body?: Record<string, unknown> }>();
    const phone = normalizePhone(request.body?.phone);

    // Telefon raqami yo'q/noto'g'ri formatda bo'lsa — bu guard indamaydi,
    // DTO validatsiyasi (class-validator) buni allaqachon rad etadi.
    if (!phone) return true;

    const now = Date.now();
    const windowStart = now - this.windowMs;
    const existing = (this.attempts.get(phone) ?? []).filter(
      (ts) => ts > windowStart,
    );

    if (existing.length >= this.limit) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'PHONE_RATE_LIMIT_EXCEEDED',
            message:
              "Bu telefon raqami uchun so'rovlar soni chegaradan oshdi. Birozdan so'ng qayta urinib ko'ring.",
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    existing.push(now);
    this.attempts.set(phone, existing);

    // Xotira sizib chiqishining oldini olish uchun — vaqti-vaqti bilan
    // butunlay bo'sh (oynadan tashqari) yozuvlarni tozalaymiz.
    if (this.attempts.size > 5000) {
      for (const [key, timestamps] of this.attempts) {
        if (timestamps.every((ts) => ts <= windowStart)) {
          this.attempts.delete(key);
        }
      }
    }

    return true;
  }
}

function normalizePhone(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
