import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * SECURITY-P3 (A12-4) CSP enforcement follow-up
 * (docs/product/security-product-readiness-report.md).
 *
 * A fresh, cryptographically random nonce is minted on every request and
 * used, together with 'strict-dynamic', so that only Next.js's own
 * framework-injected inline scripts (hydration bootstrap, RSC payload) --
 * the only inline scripts this app renders, no GTM/analytics/Sentry found
 * in this app (verified: root layout + providers) -- are allowed to run.
 * No 'unsafe-inline' on script-src.
 *
 * The nonce is per-request and is never cached or reused: this app's
 * (dashboard) and (auth) route groups are already dynamically rendered
 * (they read the session cookie), and Vercel never CDN-caches a response
 * carrying a header set in this proxy -- see the production-readiness
 * review in the security report.
 *
 * CSP_ENFORCE gates whether this ships as the real, blocking
 * `Content-Security-Policy` header or the non-blocking `-Report-Only`
 * variant. Unset (or anything other than the literal string "true") always
 * means Report-Only.
 *
 * (Next.js 16: `middleware` was renamed `proxy` -- see web-admin/proxy.ts
 * and web-user/proxy.ts for the equivalent in the other two apps.)
 */
function buildCsp(nonce: string): string {
  // CSP_EXTRA_CONNECT_SRC: unset in every real deployment (QA and
  // production alike, which reach the backend at https://api.safaar.uz,
  // already listed below). Exists solely so a developer running `next
  // start` against a raw local/Tailscale backend address (e.g. QA's
  // 100.109.46.108:4400, used by this repo's own local Playwright harness)
  // can additionally allow that one address without touching the shipped
  // policy. Space-separated origins, appended verbatim -- never a
  // wildcard, never read from anything but this explicit, opt-in env var.
  const extraConnectSrc = (process.env.CSP_EXTRA_CONNECT_SRC ?? "").trim();
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://pub-9055e0d28a444107a7df2431aff012ee.r2.dev https://unpkg.com https://*.tile.openstreetmap.org",
    "font-src 'self' data:",
    `connect-src 'self' https://api.safaar.uz wss://api.safaar.uz https://*.up.railway.app wss://*.up.railway.app${extraConnectSrc ? ` ${extraConnectSrc}` : ""}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const headerName =
    process.env.CSP_ENFORCE === "true"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(headerName, csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico|woff2?)$).*)",
  ],
};
