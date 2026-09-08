/**
 * Locale redirect (Next.js 16: `middleware` → `proxy`), plus
 * SECURITY-P3 (A12-4) CSP enforcement follow-up
 * (docs/product/security-product-readiness-report.md).
 *
 * URL'da til prefiksi bo'lmasa (`/hotels`), foydalanuvchi brauzeri tiliga qarab
 * mos tilga yo'naltiramiz (`/uz/hotels`). Tashqi kutubxonasiz — `Accept-Language`
 * headerini o'zimiz tahlil qilamiz.
 *
 * A fresh, cryptographically random nonce is minted on every request and
 * used, together with 'strict-dynamic', so that only Next.js's own
 * framework-injected inline scripts and this app's one inline script (GTM,
 * threaded through via AnalyticsProvider's `nonce` prop -- see
 * app/[lang]/layout.tsx) are allowed to run. No 'unsafe-inline' on
 * script-src. The nonce is per-request and never cached/reused (Vercel
 * never CDN-caches a response carrying a header set here). CSP_ENFORCE
 * gates real enforcement vs. Report-Only; unset always means Report-Only.
 */
import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale, isLocale } from "@/i18n/config";

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'",
    // https://freepngimg.com: a hardcoded car-icon image on the /transport
    // page, caught live via enforced-CSP Playwright testing, not by static
    // reading -- see docs/product/security-product-readiness-report.md.
    "img-src 'self' data: https://images.unsplash.com https://*.safaar.uz https://*.up.railway.app https://pub-9055e0d28a444107a7df2431aff012ee.r2.dev https://unpkg.com https://*.tile.openstreetmap.org https://freepngimg.com",
    "font-src 'self' data:",
    // CSP_EXTRA_CONNECT_SRC: see apps/web-partner/proxy.ts for the full
    // rationale -- unset in every real deployment, exists only so local
    // Playwright testing against a raw QA backend address can opt in.
    `connect-src 'self' https://api.safaar.uz wss://api.safaar.uz https://*.up.railway.app wss://*.up.railway.app https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com${(process.env.CSP_EXTRA_CONNECT_SRC ?? "").trim() ? ` ${(process.env.CSP_EXTRA_CONNECT_SRC ?? "").trim()}` : ""}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

function withCsp(response: NextResponse, nonce: string): NextResponse {
  const headerName =
    process.env.CSP_ENFORCE === "true"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";
  response.headers.set(headerName, buildCsp(nonce));
  return response;
}

function pickLocale(request: NextRequest): string {
  const header = request.headers.get("accept-language");
  if (!header) return defaultLocale;

  // "ru-RU,ru;q=0.9,en;q=0.8" → eng yuqori q bo'yicha tartiblangan tillar.
  const ordered = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ordered) {
    if (isLocale(tag)) return tag;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (!hasLocale) {
    const locale = pickLocale(request);
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return withCsp(NextResponse.redirect(request.nextUrl), nonce);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  return withCsp(
    NextResponse.next({ request: { headers: requestHeaders } }),
    nonce,
  );
}

export const config = {
  // _next ichki yo'llari va fayllarni (kengaytmasi borlar) o'tkazib yuboramiz.
  matcher: ["/((?!_next|.*\\..*).*)"],
};
