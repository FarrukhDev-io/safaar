/**
 * UZS valyutasini lokalizatsiya bilan formatlash.
 * Misol: formatMoney(2400000) → "2 400 000 so'm"
 */
export function formatMoney(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0 so'm";
  const sign = value < 0 ? "-" : "";
  const digits = Math.trunc(Math.abs(value)).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${grouped} so'm`;
}

/**
 * Sanani O'zbekistondagi standartda formatlash.
 * Misol: formatDate("2026-06-27") → "27.06.2026"
 */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  if (!(date instanceof Date) || isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Sana va vaqt birgalikda. */
export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  if (!(date instanceof Date) || isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * O'zbek telefon raqamini formatlash.
 * Misol: formatPhone("998901234567") → "+998 90 123 45 67"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 12 || !digits.startsWith("998")) return phone;
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(
    5,
    8,
  )} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
}
