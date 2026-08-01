"use server";

import { redirect } from "next/navigation";
import { Role } from "@safaar/types";
import { api, ApiRequestError } from "@/lib/api";
import { clearSession, getSession, setSession } from "@/lib/auth/session";
import { defaultLocale, isLocale } from "@/i18n/config";
import { config } from "../../config/config";

/** OTP yuborish natijasi (LoginForm `useActionState`da ishlatadi). */
export interface OtpState {
  ok: boolean;
  devCode?: string;
  error?: string;
}

export async function requestOtpAction(
  _prev: OtpState,
  formData: FormData,
): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, error: "EMAIL_REQUIRED" };

  try {
    // Send email via the auth client. Note: The backend /auth/user/send-otp expects a body of { email } (SendEmailOtpDto).
    // The current api-client has a sendOtp(phone) method which passes { phone }.
    // Since packages/api-client is read-only according to boundaries, we will invoke the endpoint directly, or we can adapt by sending email as the parameter.
    // In packages/api-client: sendOtp(phone) performs rawApi.post("/auth/user/send-otp", { phone })
    // Since we need to send { email } to /auth/user/send-otp, we can bypass the api-client wrapper or check if we can call it.
    // Actually, calling rawApi.post directly or adapting: let's inspect if rawApi is accessible.
    // Alternatively, we can see if we can adapt it. Since we cannot modify packages/api-client, we can just fetch or do a custom call.
    // Wait, let's look at how we can implement it. Let's write the adapter here in actions.ts.
    // In api.ts or auth.ts, api is exported. Can we do a direct POST to rawApi, or does `api` have a way?
    // Let's use fetch or a custom request to backend `/auth/user/send-otp` and `/auth/user/verify-otp` matching the SendEmailOtpDto and VerifyEmailOtpRequestDto.
    // Let's look at lib/api.ts. It exports `api` which wraps `@safaar/api-client`.
    // Let's check client.ts of api-client. We can import rawApi if it is exported, or just use fetch since we have config.apiUrl.
    // Let's see if we can perform a direct request or write a custom helper using fetch.
    const response = await fetch(`${config.apiUrl}/auth/user/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "ERROR");
    }
    return { ok: true, devCode: data.devCode };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "ERROR",
    };
  }
}

export interface VerifyState {
  error?: string;
  needsProfile?: boolean;
  locale?: string;
}

export async function verifyOtpAction(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const rawLocale = String(formData.get("locale") ?? defaultLocale);
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const next = String(formData.get("next") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    const response = await fetch(`${config.apiUrl}/auth/user/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "ERROR");
    }

    await setSession({
      userId: result.user.id,
      role: Role.USER,
      email: result.user.email,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    if (!result.user.firstName) {
      if (firstName) {
        const session = await getSession();
        if (!session) return { error: "SESSION_EXPIRED" };

        const passwordError = validatePassword(password);
        if (passwordError) return { error: passwordError };

        await api.auth.completeProfile(session.accessToken, {
          firstName,
          lastName: lastName || undefined,
          email: email || undefined,
          password: password || undefined,
        });
        await setSession({ ...session });

        const target = next.startsWith("/") ? next : `/${locale}`;
        redirect(target);
      }

      return { needsProfile: true, locale };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ERROR",
    };
  }

  const target = next.startsWith("/") ? next : `/${locale}`;
  redirect(target);
}

export interface CompleteProfileState {
  error?: string;
  ok?: boolean;
}

export async function completeProfileAction(
  _prev: CompleteProfileState,
  formData: FormData,
): Promise<CompleteProfileState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const rawLocale = String(formData.get("locale") ?? defaultLocale);
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const password = String(formData.get("password") ?? "");

  if (!firstName) {
    return { error: "FIRST_NAME_REQUIRED" };
  }
  if (!email) {
    return { error: "EMAIL_REQUIRED" };
  }

  const passwordError = validatePassword(password);
  if (password && passwordError) {
    return { error: passwordError };
  }

  try {
    const session = await getSession();
    if (!session) return { error: "SESSION_EXPIRED" };

    await api.auth.completeProfile(session.accessToken, {
      firstName,
      lastName: lastName || undefined,
      email,
      password: password || undefined,
    });
    await setSession({ ...session });
  } catch (error) {
    return {
      error: error instanceof ApiRequestError ? error.message : "ERROR",
    };
  }

  redirect(`/${locale}`);
}

function validatePassword(password: string): string | null {
  if (!password) return null; // ixtiyoriy
  if (password.length < 8) return "PASSWORD_TOO_SHORT";
  if (!/[A-Z]/.test(password)) return "PASSWORD_NO_UPPERCASE";
  if (!/[a-z]/.test(password)) return "PASSWORD_NO_LOWERCASE";
  if (!/[0-9]/.test(password)) return "PASSWORD_NO_NUMBER";
  if (!/[^A-Za-z0-9]/.test(password)) return "PASSWORD_NO_SPECIAL";
  return null;
}

export async function logoutAction(rawLocale: string): Promise<void> {
  await clearSession();
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  redirect(`/${locale}`);
}

export async function getClientSession() {
  return getSession();
}
