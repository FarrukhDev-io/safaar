/** Har bir test yugurishida yagona, haqiqiy formatga mos telefon raqam yaratadi. */
export function uniqueUzPhone(): string {
  const suffix = Date.now().toString().slice(-8);
  return `+9989${suffix}`.slice(0, 13);
}
