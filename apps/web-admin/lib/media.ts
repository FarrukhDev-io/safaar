const DEFAULT_USER_SITE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://web-user-rho.vercel.app';

const USER_SITE_URL = (
  process.env.NEXT_PUBLIC_USER_SITE_URL?.trim() || DEFAULT_USER_SITE_URL
).replace(/\/$/, '');

/**
 * Ba'zi (asosan demo/seed) yozuvlarda rasm URL'i ildizga nisbatan
 * ("/hotel-uzbekistan.jpeg" kabi) saqlangan — bu fayllar faqat
 * web-user'ning `public/` papkasida mavjud. web-admin shu qiymatni
 * o'z originida to'g'ridan-to'g'ri so'rasa, fayl topilmay 404 qaytardi
 * (xuddi web-partnerda ilgari topilgan xatoga o'xshash — BUG-006).
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${USER_SITE_URL}${url}`;
  }
  return url;
}
