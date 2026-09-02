import {
  Body,
  Controller,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import {
  UZUM_ERROR,
  UzumProvider,
  UzumWebhookError,
} from './providers/uzum.provider';

/**
 * Uzum Merchant API webhook qabul qiluvchi (rasmiy contract).
 *
 * Base URL (Uzum-ga beriladi): `<PUBLIC_API_ORIGIN>/v1/uzum/webhook`
 * Uzum shu manzilga `/{operation}` qo'shib POST qiladi:
 *   /v1/uzum/webhook/check    /create    /confirm    /reverse    /status
 *
 * `@Res()` (passthrough EMAS) — bu route uchun NestJS standart javob
 * yo'nalishi (global `ApiResponseInterceptor` envelope + `HttpErrorFilter`)
 * o'chiriladi, javobni to'liq o'zimiz boshqaramiz. Sabab: Uzum contract
 * shakli SAFAAR `{ success, data }` envelope'idan farq qiladi va xato
 * javoblari HTTP 400 bo'lishi shart (Click doim 200 dan farqli).
 */
@ApiTags('payments')
@Controller()
export class UzumWebhookController {
  private readonly logger = new Logger(UzumWebhookController.name);

  private static readonly OPERATIONS = new Set([
    'check',
    'create',
    'confirm',
    'reverse',
    'status',
  ]);

  constructor(
    private readonly payments: PaymentsService,
    private readonly uzum: UzumProvider,
  ) {}

  @Post('uzum/webhook/:operation')
  async handle(
    @Param('operation') operation: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() raw: unknown,
  ): Promise<void> {
    let serviceId: unknown = null;
    try {
      // 1) Basic Auth (10001).
      this.uzum.assertBasicAuth(req.headers.authorization);

      // 2) Tana korrekt JSON obyekt bo'lishi kerak (10002).
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new UzumWebhookError(UZUM_ERROR.BAD_JSON);
      }
      const body = raw as Record<string, unknown>;
      serviceId = body.serviceId ?? null;

      // 3) Operatsiya (10003).
      if (!UzumWebhookController.OPERATIONS.has(operation)) {
        throw new UzumWebhookError(UZUM_ERROR.INVALID_OPERATION, serviceId);
      }

      let payload: unknown;
      switch (operation) {
        case 'check':
          payload = await this.payments.uzumCheck(body);
          break;
        case 'create':
          payload = await this.payments.uzumCreate(body);
          break;
        case 'confirm':
          payload = await this.payments.uzumConfirm(body);
          break;
        case 'reverse':
          payload = await this.payments.uzumReverse(body);
          break;
        case 'status':
          payload = await this.payments.uzumStatus(body);
          break;
      }

      res.status(HttpStatus.OK).json(payload);
    } catch (err) {
      if (err instanceof UzumWebhookError) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json(this.uzum.errorBody(err.serviceId ?? serviceId, err.errorCode));
        return;
      }
      // Postgres UNIQUE buzilishi (`payments_idempotency_key_key` /
      // `payment_events_event_key_key`) — bir xil transId qayta kelgani.
      if (this.isUniqueViolation(err)) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json(this.uzum.errorBody(serviceId, UZUM_ERROR.ALREADY_CREATED));
        return;
      }
      // Kutilmagan ichki xato — contract bo'yicha 99999 / HTTP 400.
      // Sensitive ma'lumot (Authorization, karta, telefon) log qilinmaydi.
      this.logger.error(
        `uzum/${operation} kutilmagan xato: ${
          err instanceof Error ? err.message : 'nomaʼlum'
        }`,
      );
      res
        .status(HttpStatus.BAD_REQUEST)
        .json(this.uzum.errorBody(serviceId, UZUM_ERROR.INTERNAL));
    }
  }

  private isUniqueViolation(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: unknown }).code === '23505'
    );
  }
}
