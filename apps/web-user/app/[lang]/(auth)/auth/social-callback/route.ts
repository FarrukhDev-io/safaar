import { NextRequest, NextResponse } from "next/server";
import { Role } from "@safaar/types";
import { api, ApiRequestError } from "@/lib/api";
import { config } from "@/lib/config/config";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

const COOKIE_NAME = "safaar_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type RouteContext = {
  params: Promise<{ lang: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const code = String(request.nextUrl.searchParams.get("code") ?? "").trim();
  const next = safeNext(request.nextUrl.searchParams.get("next")) || `/${locale}`;

  if (!code) {
    return redirectToLogin(
      request,
      locale,
      request.nextUrl.searchParams.get("socialError") ?? "OAUTH_CODE_MISSING",
      next,
    );
  }

  try {
    const result = await api.auth.exchangeOAuthCode(code);

    if ("requiresRegistration" in result && result.requiresRegistration) {
      const registerUrl = new URL(`/${locale}/register`, request.nextUrl.origin);
      registerUrl.searchParams.set("registrationToken", result.registrationToken);
      registerUrl.searchParams.set("provider", result.provider);
      if (result.email) registerUrl.searchParams.set("email", result.email);
      if (result.firstName) registerUrl.searchParams.set("firstName", result.firstName);
      if (result.lastName) registerUrl.searchParams.set("lastName", result.lastName);
      if (next) registerUrl.searchParams.set("next", next);
      
      return NextResponse.redirect(registerUrl);
    }

    const authResult = result as any;
    const response = NextResponse.redirect(new URL(next, request.nextUrl.origin));
    response.cookies.set(COOKIE_NAME, JSON.stringify({
      userId: authResult.user.id,
      role: Role.USER,
      email: authResult.user.email,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
    }), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: config.isProd,
      maxAge: MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    return redirectToLogin(
      request,
      locale,
      error instanceof ApiRequestError
        ? error.code || "OAUTH_EXCHANGE_FAILED"
        : "OAUTH_EXCHANGE_FAILED",
      next,
    );
  }
}

function safeNext(value: string | null): string {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}

function redirectToLogin(
  request: NextRequest,
  locale: Locale,
  socialError: string,
  next: string,
) {
  const target = new URL(`/${locale}/login`, request.nextUrl.origin);
  target.searchParams.set("socialError", socialError);
  if (next) target.searchParams.set("next", next);
  return NextResponse.redirect(target);
}
