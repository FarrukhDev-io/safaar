import { rawApi } from "../client";
import { camelizeKeys } from "../case";

export interface SendOtpResult {
  sent: boolean;
  challengeId?: string;
  expiresInSeconds: number;
  resendAfterSeconds?: number;
  devCode?: string;
}

export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export type OAuthExchangeResult = VerifyOtpResult;

export interface PasswordResetCodeResult {
  sent: boolean;
  challengeId?: string;
  expiresInSeconds?: number;
  resendAfterSeconds?: number;
}

export interface VerifyResetCodeResult {
  verified: boolean;
  resetToken: string;
  expiresInSeconds: number;
}

export interface CompleteProfileResult {
  id: string;
  phone?: string | null;
  email: string;
  firstName: string;
  lastName: string;
}

export const authService = {
  /** `POST /auth/user/login` — email va parol orqali kirish. */
  async login(email: string, password: string): Promise<VerifyOtpResult> {
    const raw = await rawApi.post<unknown>("/auth/user/login", {
      email,
      password,
    });
    return camelizeKeys<VerifyOtpResult>(raw);
  },

  /** `POST /auth/user/send-otp` — email manziliga OTP yuborish. */
  async sendEmailOtp(email: string): Promise<SendOtpResult> {
    const raw = await rawApi.post<unknown>("/auth/user/send-otp", { email });
    return camelizeKeys<SendOtpResult>(raw);
  },

  /** `POST /auth/user/verify-otp` — email kodini tekshirish, token + user qaytaradi. */
  async verifyEmailOtp(
    email: string,
    code: string,
    challengeId?: string,
  ): Promise<VerifyOtpResult> {
    const raw = await rawApi.post<unknown>("/auth/user/verify-otp", {
      email,
      code,
      challenge_id: challengeId,
    });
    return camelizeKeys<VerifyOtpResult>(raw);
  },

  /** `POST /auth/oauth/exchange` — OAuth callbackdagi bir martalik kodni sessiya tokenlariga almashtiradi. */
  async exchangeOAuthCode(code: string): Promise<OAuthExchangeResult> {
    const raw = await rawApi.post<unknown>("/auth/oauth/exchange", { code });
    return camelizeKeys<OAuthExchangeResult>(raw);
  },

  /** `POST /auth/user/forgot-password` — emailga parol tiklash kodi yuborish. */
  async forgotPassword(email: string): Promise<PasswordResetCodeResult> {
    const raw = await rawApi.post<unknown>("/auth/user/forgot-password", {
      email,
    });
    return camelizeKeys<PasswordResetCodeResult>(raw);
  },

  /** `POST /auth/user/verify-reset-code` — parol tiklash kodini tekshirish. */
  async verifyResetCode(
    email: string,
    code: string,
    challengeId?: string,
  ): Promise<VerifyResetCodeResult> {
    const raw = await rawApi.post<unknown>("/auth/user/verify-reset-code", {
      email,
      code,
      challenge_id: challengeId,
    });
    return camelizeKeys<VerifyResetCodeResult>(raw);
  },

  /** `POST /auth/user/reset-password` — yangi parolni saqlash. */
  async resetPassword(
    email: string,
    password: string,
    resetToken: string,
  ): Promise<{ reset: boolean }> {
    const raw = await rawApi.post<unknown>("/auth/user/reset-password", {
      email,
      password,
      reset_token: resetToken,
    });
    return camelizeKeys<{ reset: boolean }>(raw);
  },

  /** @deprecated User OTP oqimi email orqali ishlaydi. `sendEmailOtp`dan foydalaning. */
  async sendOtp(email: string): Promise<SendOtpResult> {
    const raw = await rawApi.post<unknown>("/auth/user/send-otp", { email });
    return camelizeKeys<SendOtpResult>(raw);
  },

  /** @deprecated User OTP oqimi email orqali ishlaydi. `verifyEmailOtp`dan foydalaning. */
  async verifyOtp(email: string, code: string): Promise<VerifyOtpResult> {
    const raw = await rawApi.post<unknown>("/auth/user/verify-otp", {
      email,
      code,
    });
    return camelizeKeys<VerifyOtpResult>(raw);
  },

  /** `POST /auth/user/complete-profile` — birinchi marta kirgan foydalanuvchi profilini to'ldiradi. */
  async completeProfile(
    token: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      password?: string;
    },
  ): Promise<CompleteProfileResult> {
    const body: Record<string, unknown> = {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      email: data.email,
    };
    if (data.password) {
      body.password = data.password;
    }
    const raw = await rawApi.post<unknown>(
      "/auth/user/complete-profile",
      body,
      { token },
    );
    return camelizeKeys<CompleteProfileResult>(raw);
  },
};
