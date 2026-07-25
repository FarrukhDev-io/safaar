/** Restoran uchun kun ichidagi vaqt-slotlarni hisoblash yordamchilari. */

export const SLOT_STEP_MINUTES = 30;
/** Har bir restoran broni standart bo'yicha nechta daqiqa davom etadi (stol band hisoblanadi). */
export const DEFAULT_SLOT_DURATION_MINUTES = 90;
const FALLBACK_OPEN = "09:00";
const FALLBACK_CLOSE = "23:00";

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Ochilish/yopilish vaqtidan `SLOT_STEP_MINUTES` qadamli slotlar ro'yxatini yaratadi. */
export function buildTimeSlots(openTime: string, closeTime: string): string[] {
  let start = toMinutes(openTime);
  let end = toMinutes(closeTime);
  if (!(end > start)) {
    start = toMinutes(FALLBACK_OPEN);
    end = toMinutes(FALLBACK_CLOSE);
  }
  const slots: string[] = [];
  for (let t = start; t < end; t += SLOT_STEP_MINUTES) {
    slots.push(toHHMM(t));
  }
  return slots;
}
