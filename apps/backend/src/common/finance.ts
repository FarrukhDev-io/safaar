/**
 * Komissiya hisob-kitobi butun backend uchun bitta joyda — avval har bir
 * bron yaratish yo'li (mehmonxona/avtobus mijoz oqimi, hamkor walk-in
 * bron) o'zining qattiq yozilgan 12% ulushini ishlatardi, admin panelda
 * hamkor uchun sozlangan `default_commission_rate` esa hech qayerda
 * o'qilmasdi. Endi hammasi shu funksiya orqali, tashkilotning haqiqiy
 * stavkasi bilan hisoblanadi.
 */
export const DEFAULT_COMMISSION_RATE_PERCENT = 12;

export function calculateCommission(
  subtotal: number,
  ratePercent: number | string | null | undefined,
): number {
  const rate = normalizeCommissionRate(ratePercent);
  return Math.round(subtotal * (rate / 100));
}

export function normalizeCommissionRate(
  ratePercent: number | string | null | undefined,
): number {
  const value = Number(ratePercent);
  if (!Number.isFinite(value) || value < 0) {
    return DEFAULT_COMMISSION_RATE_PERCENT;
  }
  return value;
}
