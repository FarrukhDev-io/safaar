"use client";

import { useActionState, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { AuthDict } from "@/i18n/dictionaries";
import {
  requestOtpAction,
  verifyOtpAction,
  completeProfileAction,
  type OtpState,
  type VerifyState,
  type CompleteProfileState,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthSplitLayout } from "./AuthSplitLayout";

function passwordStrength(pw: string): { label: string; level: number; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: "", level: 0, color: "bg-red-500" };
  if (score <= 3) return { label: "Zaif", level: 1, color: "bg-red-500" };
  if (score <= 4) return { label: "O'rtacha", level: 2, color: "bg-yellow-500" };
  return { label: "Kuchli", level: 3, color: "bg-green-500" };
}

export function RegisterForm({
  locale,
  next,
  dict,
}: {
  locale: Locale;
  next: string;
  dict: AuthDict;
}) {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromQuery || "");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((v) => !v);
  }, []);

  const strength = useMemo(() => passwordStrength(password), [password]);

  const [otpState, requestAction, sending] = useActionState<OtpState, FormData>(
    requestOtpAction,
    { ok: false },
  );
  const [verifyState, verifyAction, verifying] = useActionState<
    VerifyState,
    FormData
  >(verifyOtpAction, {});
  const [profileState, profileAction, saving] = useActionState<
    CompleteProfileState,
    FormData
  >(completeProfileAction, {});

  const isStep2 = verifyState.needsProfile;
  const action = isStep2 ? profileAction : verifyAction;
  const loading = sending || verifying || saving;

  const errorMsg = otpState.error || verifyState.error || profileState.error;

  const passwordErrorMap = useMemo((): Record<string, string> => ({
    PASSWORD_TOO_SHORT: dict.passwordTooShort,
    PASSWORD_NO_UPPERCASE: dict.passwordNoUppercase,
    PASSWORD_NO_LOWERCASE: dict.passwordNoLowercase,
    PASSWORD_NO_NUMBER: dict.passwordNoNumber,
    PASSWORD_NO_SPECIAL: dict.passwordNoSpecial,
  }), [dict]);

  const getErrorMessage = useCallback((err: string) => {
    if (passwordErrorMap[err]) return passwordErrorMap[err];
    switch (err) {
      case "EMAIL_REQUIRED":
        return dict.emailRequired;
      case "EMAIL_INVALID":
        return dict.emailInvalid;
      case "FIRST_NAME_REQUIRED":
        return dict.firstNameRequired;
      case "OTP_INVALID":
        return dict.otpInvalid;
      case "OTP_EXPIRED":
        return dict.otpExpired;
      default:
        return dict.error;
    }
  }, [dict, passwordErrorMap]);

  return (
    <AuthSplitLayout locale={locale} dict={dict}>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          {isStep2 ? dict.completeProfileTitle : dict.registerTitle}
        </h1>
        <p className="text-sm font-bold text-slate-700">
          {isStep2 ? dict.completeProfileSubtitle : dict.registerSubtitle}
        </p>
      </header>

      <form action={action} className="flex flex-col gap-4">
        {!isStep2 ? (
          <>
            {/* Step 1: Email Entry & Code Request */}
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
                readOnly={otpState.ok}
                className={otpState.ok ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}
              />
            </label>

            {otpState.devCode && (
              <p className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">
                {dict.devCode}: <strong>{otpState.devCode}</strong>
              </p>
            )}

            {/* OTP input appears when code is sent */}
            {otpState.ok && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">{dict.code}</span>
                <Input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  placeholder="••••••"
                  autoFocus
                />
              </label>
            )}
          </>
        ) : (
          <>
            {/* Step 2: Complete Profile Fields */}
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="next" value={next} />

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                {dict.firstName} <span className="text-red-500">*</span>
              </span>
              <Input
                name="firstName"
                required
                placeholder={dict.firstNamePlaceholder}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">{dict.lastName}</span>
              <Input
                name="lastName"
                placeholder={dict.lastNamePlaceholder}
              />
            </label>

            {/* Password */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">{dict.password}</span>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={dict.passwordPlaceholder}
                  value={password}
                  onChange={handlePasswordChange}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            {password && (
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= strength.level ? strength.color : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-700">{strength.label}</p>
              </div>
            )}

            {/* Password requirements checklist */}
            <div className="rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-xs text-slate-700">
              <p className="mb-1 font-extrabold uppercase tracking-wider text-slate-800">{dict.passwordRequirements}</p>
              <ul className="list-inside list-disc space-y-0.5 font-bold">
                <li className={password.length >= 8 ? "text-green-700 font-extrabold" : ""}>{dict.passwordMinChars}</li>
                <li className={/[A-Z]/.test(password) ? "text-green-700 font-extrabold" : ""}>{dict.passwordUppercase}</li>
                <li className={/[a-z]/.test(password) ? "text-green-700 font-extrabold" : ""}>{dict.passwordLowercase}</li>
                <li className={/[0-9]/.test(password) ? "text-green-700 font-extrabold" : ""}>{dict.passwordNumber}</li>
                <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-700 font-extrabold" : ""}>{dict.passwordSpecial}</li>
              </ul>
            </div>
          </>
        )}

        {errorMsg && (
          <p className="text-sm font-bold text-red-600">
            {getErrorMessage(errorMsg)}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          formAction={!isStep2 && !otpState.ok ? requestAction : undefined}
        >
          {isStep2 ? dict.save : (otpState.ok ? dict.verifyAndRegister : dict.sendCode)}
        </Button>

        <p className="text-center text-sm font-bold text-slate-700">
          {dict.hasAccount}{" "}
          <Link
            href={`/${locale}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-extrabold text-blue-700 hover:text-blue-800"
          >
            {dict.login}
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
