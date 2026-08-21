import type { Page } from '@playwright/test';

export interface TrackedIssues {
  consoleErrors: string[];
  unexpectedResponses: { url: string; status: number }[];
  expectedConsoleNotes: string[];
}

/**
 * Real brauzer konsoli va networkni kuzatadi — TASK 17/18 talabi:
 * "0 unexpected console errors" va "0 unexpected 401/403/404/422/500".
 * `markExpected(url)` orqali ataylab kutilgan xato-javoblar (masalan test
 * webhook'ning haqiqiy tashqi so'rovi) ro'yxatdan chiqarib qo'yiladi.
 */
export function trackPageIssues(page: Page): TrackedIssues & { markExpected: (substr: string) => void } {
  const issues: TrackedIssues = { consoleErrors: [], unexpectedResponses: [], expectedConsoleNotes: [] };
  // `/api/auth/refresh` — sessiyani "jimgina" httpOnly cookie orqali
  // tiklashga urinish; cookie bo'lmasa yoki chiqishdan keyin bo'lsa ATAYLAB
  // 401 qaytaradi va ilova buni xatosiz qabul qiladi (bu fayldagi
  // 'console' handler'idagi izohga qarang).
  const expectedUrlSubstrings: string[] = ['/api/auth/refresh'];

  page.on('websocket', (ws) => {
    ws.on('framereceived', () => {});
    ws.on('socketerror', (err) => {
      // Sahifa navigatsiya paytida websocket handshake yakunlanmasdan
      // to'xtatilishi — real foydalanuvchi ta'sirida bo'lmaydigan,
      // zararsiz holat (Playwright'ning tez sahifa almashinuvi tufayli).
      if (err.includes('closed before the connection is established')) return;
      issues.consoleErrors.push(`WS ERROR: ${err} [url: ${ws.url()}]`);
    });
    ws.on('close', () => {});
  });

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // React DevTools tavsiyasi va HMR xabarlari xato emas.
    if (text.includes('Download the React DevTools')) return;
    // web-partner/web-user har bir sahifa ochilganda (agar joriy tokensiz
    // bo'lsa) httpOnly refresh-token cookie orqali "jimgina" sessiyani
    // tiklashga urinadi (masalan yangi tab yoki chiqishdan keyingi holat).
    // Cookie mavjud bo'lmasa backend ATAYLAB 401 qaytaradi va ilova buni
    // xatosiz, jimgina qabul qiladi (`.catch()`) — brauzer konsolida
    // qoladigan 401 shu bilan bog'liq bo'lsa, haqiqiy nosozlik emas, real
    // kutilgan holat (TASK 17 "expected negative" holati).
    if (
      text.includes('401') &&
      /Failed to load resource/i.test(text)
    ) {
      issues.expectedConsoleNotes.push(`${text} [page: ${page.url()}] — silent /api/auth/refresh retry with no session cookie yet`);
      return;
    }
    issues.consoleErrors.push(`${text} [page: ${page.url()}]`);
  });

  page.on('response', (res) => {
    const status = res.status();
    if (![401, 403, 404, 422, 500].includes(status)) return;
    const url = res.url();
    if (expectedUrlSubstrings.some((s) => url.includes(s))) return;
    issues.unexpectedResponses.push({ url, status });
  });

  return {
    ...issues,
    markExpected: (substr: string) => expectedUrlSubstrings.push(substr),
  };
}
