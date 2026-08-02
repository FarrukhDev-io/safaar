export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export const TODAY_ISO = todayIso();
