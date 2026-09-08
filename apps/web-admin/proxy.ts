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
 * (they read the session cookie right here), and Vercel never CDN-caches a
 * response carrying a header set in this proxy -- see the
 * production-readiness review in the security report.
 *
 * CSP_ENFORCE gates whether this ships as the real, blocking
 * `Content-Security-Policy` header or the non-blocking `-Report-Only`
 * variant. Unset (or anything other than the literal string "true") always
 * means Report-Only.
 */
function buildCsp(nonce: string): string {
  // CSP_EXTRA_CONNECT_SRC: see apps/web-partner/proxy.ts for the full
  // rationale -- unset in every real deployment, exists only so local
  // Playwright testing against a raw QA backend address can opt in.
  const extraConnectSrc = (process.env.CSP_EXTRA_CONNECT_SRC ?? "").trim();
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://pub-9055e0d28a444107a7df2431aff012ee.r2.dev",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' https://api.safaar.uz wss://api.safaar.uz https://*.up.railway.app wss://*.up.railway.app${extraConnectSrc ? ` ${extraConnectSrc}` : ""}`,
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

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  const next = () =>
    NextResponse.next({ request: { headers: requestHeaders } });

  // --- pre-existing admin_token auth gate (unchanged) ---
  const token = request.cookies.get("admin_token")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");

  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return withCsp(next(), nonce);
  }

  if (!token && !isAuthPage) {
    return withCsp(
      NextResponse.redirect(new URL("/login", request.url)),
      nonce,
    );
  }

  if (token && isAuthPage) {
    return withCsp(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      nonce,
    );
  }

  if (request.nextUrl.pathname === "/") {
    return withCsp(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      nonce,
    );
  }

  return withCsp(next(), nonce);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
