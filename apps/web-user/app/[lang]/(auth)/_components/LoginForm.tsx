"use client";

import { useEffect, useActionState, useState, useCallback } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { AuthDict } from "@/i18n/dictionaries";
import {
  requestOtpAction,
  verifyOtpAction,
  type OtpState,
  type VerifyState,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthSplitLayout } from "./AuthSplitLayout";

import { config } from "@/lib/config";

const API_URL = config.apiUrl;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        fill="#1877F2"
      />
    </svg>
  );
}

export function LoginForm({
  locale,
  next,
  dict,
}: {
  locale: Locale;
  next: string;
  dict: AuthDict;
}) {
  const [email, setEmail] = useState("");
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const [otpState, requestAction, sending] = useActionState<OtpState, FormData>(
    requestOtpAction,
    { ok: false },
  );
  const [verifyState, verifyAction, verifying] = useActionState<
    VerifyState,
    FormData
  >(verifyOtpAction, {});

  // Yangi foydalanuvchi — profil to'ldirish sahifasiga yo'naltirish
  useEffect(() => {
    if (verifyState.needsProfile && verifyState.locale) {
      const target = `/${verifyState.locale}/register?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`;
      window.location.href = target;
    }
  }, [verifyState.needsProfile, verifyState.locale, email, next]);

  return (
    <AuthSplitLayout locale={locale} dict={dict}>
      {!otpState.ok ? (
        <form action={requestAction} className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{dict.title}</h1>
            <p className="text-sm font-bold text-slate-700">{dict.subtitle}</p>
          </header>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">{dict.email}</span>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={handleEmailChange}
              placeholder={dict.emailPlaceholder}
            />
          </label>
          {otpState.error && (
            <p className="text-sm font-bold text-red-600">
              {otpState.error === "EMAIL_REQUIRED"
                ? dict.emailRequired
                : otpState.error === "EMAIL_INVALID"
                  ? dict.emailInvalid
                  : dict.error}
            </p>
          )}
          <Button type="submit" size="lg" loading={sending}>
            {dict.sendCode}
          </Button>

          <p className="text-center text-sm font-bold text-slate-700">
            {dict.noAccount}{" "}
            <Link
              href={`/${locale}/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-extrabold text-blue-700 hover:text-blue-800"
            >
              {dict.register}
            </Link>
          </p>
        </form>
      ) : (
        <form action={verifyAction} className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{dict.codeTitle}</h1>
            <p className="text-sm font-bold text-slate-700">{dict.codeSubtitle}</p>
          </header>

          {otpState.devCode && (
            <p className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">
              {dict.devCode}: <strong>{otpState.devCode}</strong>
            </p>
          )}

          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="next" value={next} />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">{dict.code}</span>
            <Input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              placeholder="••••••"
            />
          </label>

          {verifyState.error && (
            <p className="text-sm font-bold text-red-600">
              {verifyState.error === "OTP_INVALID"
                ? dict.otpInvalid
                : verifyState.error === "OTP_EXPIRED"
                  ? dict.otpExpired
                  : dict.error}
            </p>
          )}

          <Button type="submit" size="lg" loading={verifying}>
            {dict.verify}
          </Button>
        </form>
      )}

      {/* Social login */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase font-extrabold tracking-wider">
          <span className="bg-white px-2.5 text-slate-500">{dict.or}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={`${API_URL}/auth/google?redirect=${encodeURIComponent(`/${locale}/auth/social-callback?next=${next}`)}`}
          className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-2xs transition-all hover:border-slate-350 hover:bg-slate-100/50 active:scale-[0.98]"
        >
          <GoogleIcon />
          {dict.googleLogin}
        </a>
        <a
          href={`${API_URL}/auth/facebook?redirect=${encodeURIComponent(`/${locale}/auth/social-callback?next=${next}`)}`}
          className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-2xs transition-all hover:border-slate-350 hover:bg-slate-100/50 active:scale-[0.98]"
        >
          <FacebookIcon />
          {dict.facebookLogin}
        </a>
      </div>
    </AuthSplitLayout>
  );
}
