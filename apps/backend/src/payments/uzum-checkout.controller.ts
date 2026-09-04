import {
  Body,
  Controller,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import {
  UZUM_CHECKOUT_ERROR,
  UzumCheckoutError,
  UzumCheckoutProvider,
  normalizeCheckoutCallback,
} from './providers/uzum-checkout.provider';

/**
 * Uzum **Checkout** to'lov notification / callback qabul qiluvchi.
 *
 * Route (global prefiks `v1` bilan):
 *   POST /v1/uzum/checkout/callback
 *
 * Merchant API'dan (`/v1/uzum/webhook/{check,create,confirm,reverse,status}`)
 * MUTLAQO ALOHIDA — ular hech qanday tarzda aralashmaydi.
 *
 * `@Res()` (passthrough EMAS): global `ApiResponseInterceptor` envelope va
 * `HttpErrorFilter` chetlab o'tiladi — javobni to'liq shu yerda boshqaramiz
 * (Uzum retry mantig'i uchun status kodlar aniq bo'lishi kerak). Uzum'ning
 * kutgan aniq javob shakli hali bizga noma'lum — hozircha `{ status: "OK" }`
 * (200) / `{ status: "FAILED", code }` (4xx). Spec kelganda moslashtiriladi.
 *
 * Xavfsizlik: imzo `UzumCheckoutProvider.verifyCallback` orqali FAIL-CLOSED
 * tekshiriladi (sxema sozlanmaguncha har qanday callback rad etiladi).
 * Secret / imzo / Authorization LOG QILINMAYDI.
 */
@ApiTags('payments')
@Controller()
export class UzumCheckoutController {
  private readonly logger = new Logger(UzumCheckoutController.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly checkout: UzumCheckoutProvider,
  ) {}

  @Post('uzum/checkout/callback')
  async callback(
    @Req() req: Request,
    @Res() res: Response,
    @Body() raw: unknown,
  ): Promise<void> {
    try {
      // G) noto'g'ri/bo'sh payload -> rad etamiz, hech narsani PAID qilmaymiz.
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        this.reject(
          res,
          HttpStatus.BAD_REQUEST,
          UZUM_CHECKOUT_ERROR.MALFORMED_BODY,
        );
        return;
      }
      const body = raw as Record<string, unknown>;

      // F) imzo tekshiruvi — FAIL-CLOSED (throw qiladi, agar sxema
      //    sozlanmagan bo'lsa yoki imzo mos kelmasa).
      this.checkout.verifyCallback(body, req.headers);

      const normalized = normalizeCheckoutCallback(body);
      const result = await this.payments.uzumCheckoutCallback(normalized);

      // C/D/E) mapping/amount/currency muammosi -> reject, PAID qilinmaydi.
      if (result.code) {
        const status =
          result.code === 'unknown_order'
            ? HttpStatus.NOT_FOUND
            : HttpStatus.UNPROCESSABLE_ENTITY;
        this.logger.warn(
          `uzum-checkout callback rejected code=${result.code} ` +
            `order=${normalized.orderId || '?'} state=${normalized.state}`,
        );
        this.reject(res, status, result.code);
        return;
      }

      // A/B) valid yoki duplicate -> HTTP 200.
      res.status(HttpStatus.OK).json({
        status: 'OK',
        duplicate: result.duplicate,
        applied: result.applied,
      });
    } catch (err) {
      if (err instanceof UzumCheckoutError) {
        this.logger.warn(`uzum-checkout callback rejected: ${err.code}`);
        this.reject(res, HttpStatus.UNAUTHORIZED, err.code);
        return;
      }
      // Kutilmagan ichki xato — sensitive ma'lumot LOG QILINMAYDI.
      this.logger.error(
        `uzum-checkout callback kutilmagan xato: ${
          err instanceof Error ? err.message : 'nomaʼlum'
        }`,
      );
      this.reject(res, HttpStatus.INTERNAL_SERVER_ERROR, 'internal_error');
    }
  }

  private reject(res: Response, status: number, code: string): void {
    res.status(status).json({ status: 'FAILED', code });
  }
}
