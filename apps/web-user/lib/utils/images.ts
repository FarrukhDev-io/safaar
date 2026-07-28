/**
 * Berilgan real rasm yo'lini qaytaradi:
 * - http(s) → tashqi URL, o'zidek ishlatiladi
 * - /... → lokal public papka, o'zidek ishlatiladi
 * - undefined/bo'sh → null
 */
export function resolveImage(realUrl: string | undefined): string | null {
  if (realUrl?.startsWith("http") || realUrl?.startsWith("/")) return realUrl;
  return null;
}
