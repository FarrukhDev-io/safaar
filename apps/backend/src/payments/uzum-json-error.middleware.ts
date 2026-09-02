import type { ErrorRequestHandler } from 'express';
import { UZUM_ERROR, UZUM_STATUS } from './providers/uzum.provider';

/**
 * Uzum webhook route'ini aniqlash — global prefiks (`/v1`) va legacy `/api`
 * rewrite'idan qat'i nazar mos kelishi uchun ataylab keng regex.
 * Masalan: `/v1/uzum/webhook/check`, `/api/uzum/webhook/create`.
 */
const UZUM_WEBHOOK_PATH = /\/uzum\/webhook(?:\/|$)/;

/**
 * Express body-parser (`express.json()`) noto'g'ri JSON tanasida
 * `http-errors` orqali `{ type: 'entity.parse.failed', status: 400 }`
 * belgili `SyntaxError` tashlaydi — bu route handler'ga umuman yetib
 * bormaydi.
 */
function isJsonParseError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const e = err as { type?: unknown; status?: unknown; statusCode?: unknown };
  if (e.type === 'entity.parse.failed') {
    return true;
  }
  return (
    err instanceof SyntaxError && (e.status === 400 || e.statusCode === 400)
  );
}

/**
 * Uzum Merchant API contract: noto'g'ri JSON tanasi kelganda javob AYNAN
 *
 *   HTTP 400
 *   { "serviceId": null, "status": "FAILED", "errorCode": "10002" }
 *
 * bo'lishi kerak (generic Express/`finalhandler` yoki SAFAAR
 * `{ success, error }` envelope'i emas, `errorMessage` YO'Q).
 *
 * Bu middleware FAQAT ikkala shart bajarilganda ishlaydi:
 *   1) xato — JSON parse xatosi, VA
 *   2) so'rov — Uzum webhook route'iga qaratilgan.
 * Boshqa har qanday holatda xatoni O'ZGARTIRMASDAN uzatadi (`next(err)`),
 * shuning uchun global `HttpErrorFilter`, boshqa endpoint'lar va Click/Payme
 * xatti-harakati mutlaqo o'zgarmaydi.
 *
 * Sezgir ma'lumot (Authorization sarlavhasi, raw tana) LOG QILINMAYDI.
 */
export const uzumJsonErrorMiddleware: ErrorRequestHandler = (
  err,
  req,
  res,
  next,
) => {
  const target = String(
    (req as { originalUrl?: string; url?: string }).originalUrl ??
      (req as { url?: string }).url ??
      '',
  );

  if (
    !isJsonParseError(err) ||
    !UZUM_WEBHOOK_PATH.test(target) ||
    res.headersSent
  ) {
    next(err);
    return;
  }

  res.status(400).json({
    serviceId: null,
    status: UZUM_STATUS.FAILED,
    errorCode: UZUM_ERROR.BAD_JSON,
  });
};
