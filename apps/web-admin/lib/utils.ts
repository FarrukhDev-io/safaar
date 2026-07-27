/**
 * Yordamchi funksiyalar — formatlash, className birlashtirish va boshqalar.
 */

/** className birlashtirish (falsy qiymatlani filtrlash). */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Ming xonalarni bo'shliq bilan ajratish — `toLocaleString("uz-UZ")` ishlatilmaydi,
 * chunki bu server (Node ICU) va brauzer (Chromium ICU) o'rtasida boshqacha
 * ajratuvchi belgi (oddiy va uzilmas bo'shliq) ishlab, React hydration
 * mismatchiga olib kelgan edi. Bu variant faqat oddiy string amallariga
 * tayanadi — natija server va klientda har doim bir xil bo'ladi.
 */
function groupDigits(value: number): string {
  const sign = value < 0 ? "-" : "";
  const digits = Math.trunc(Math.abs(value)).toString();
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Narxni o'zbek formatiga o'tkazish: 1234500 → "1 234 500 so'm" */
export function formatPrice(amount: number): string {
  return groupDigits(amount) + " so'm";
}

/** Qisqa narx: 85000000 → "85 mln" */
export function formatShortPrice(amount: number): string {
  if (amount >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + " mlrd";
  }
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(/\.0$/, "") + " mln";
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + " ming";
  }
  return String(amount);
}

/** Raqamni formatlash: 45230 → "45 230" */
export function formatNumber(num: number): string {
  return groupDigits(num);
}

/** ISO sanani o'zbek formatiga: "2026-06-15" → "15.06.2026" */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/** ISO sanani vaqt bilan: "2026-06-15T14:30:00" → "15.06.2026, 14:30" */
export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year}, ${hours}:${mins}`;
}

/** Nisbiy vaqt: "5 daqiqa oldin", "2 soat oldin" */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "hozirgina";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;
  return formatDate(dateStr);
}

/** O'sish foizini formatlash: +12.5% → "+12.5%" (rang bilan) */
export function formatChange(change: number): { text: string; isPositive: boolean } {
  const isPositive = change >= 0;
  const text = `${isPositive ? "+" : ""}${change.toFixed(1)}%`;
  return { text, isPositive };
}

/** To'lov usuli nomini olish */
export function getPaymentMethodName(method: string): string {
  const map: Record<string, string> = {
    click: "Click",
    payme: "Payme",
    uzcard: "Uzcard",
    humo: "Humo",
  };
  return map[method] ?? method;
}
