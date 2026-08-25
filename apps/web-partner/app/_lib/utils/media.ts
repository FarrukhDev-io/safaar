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
 * web-user'ning `public/` papkasida mavjud. web-partner shu qiymatni
 * o'z originida (masalan web-partner-khaki.vercel.app) to'g'ridan-to'g'ri
 * so'rasa, fayl topilmay 404 qaytardi. Bu yerda faqat ildizga nisbatan
 * yo'llarni web-user origini bilan to'ldiramiz — allaqachon to'liq
 * (http/https) yoki data: URL bo'lsa o'zgartirmasdan qaytaramiz.
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
