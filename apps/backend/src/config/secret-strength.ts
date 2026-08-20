/**
 * Yagona markaz — "bu secret production uchun yetarlicha kuchlimi" degan
 * tekshiruv butun ilova bo'ylab shu yerdan olinadi. Ilgari bu mantiq ikki
 * joyda (`env.validation.ts` va `auth/security.ts`) mustaqil ravishda
 * takrorlangan edi, va ikkalasida ham bir xil xato bor edi: faqat
 * `change_me` (pastki chiziq) qatorini qidirar, `change-me` (defis) kabi
 * variantlarni o'tkazib yuborardi — natijada shu xil nomlangan hardcoded
 * fallback secret "kuchli" deb hisoblanib, tekshiruvdan omon qolar edi.
 */
const MIN_SECRET_LENGTH = 32;

// "change_me", "change-me", "changeme", "CHANGE ME" — ajratuvchi belgidan
// (yoki uning yo'qligidan) qat'i nazar, katta-kichik harflarga sezgir emas.
const PLACEHOLDER_PATTERN = /change[-_\s]?me/i;

export function isWeakSecret(value: string | undefined | null): boolean {
  if (!value) return true;
  return value.length < MIN_SECRET_LENGTH || PLACEHOLDER_PATTERN.test(value);
}

/**
 * `value` kuchsiz (yo'q, juda qisqa, yoki placeholder ko'rinishida) bo'lsa
 * xato tashlaydi. Xato xabari qaysi o'zgaruvchi ekanini aytadi, lekin
 * qiymatning o'zini hech qachon chiqarmaydi — bu funksiya secret qanday
 * ko'rinishga ega ekanini logga/xato xabariga yozmaslik uchun atayin shunday.
 */
export function assertStrongSecret(
  name: string,
  value: string | undefined | null,
): asserts value is string {
  if (isWeakSecret(value)) {
    throw new Error(
      `${name} kamida ${MIN_SECRET_LENGTH} belgili va placeholder (masalan "change_me"/"change-me") bo'lmagan qiymatga ega bo'lishi kerak`,
    );
  }
}

export { MIN_SECRET_LENGTH };
