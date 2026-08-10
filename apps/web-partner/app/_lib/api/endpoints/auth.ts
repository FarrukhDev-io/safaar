import type { AuthTokens, VerifyOtpDto } from '@safaar/types';
import { request } from '../client';

export interface OtpRequestResponse {
  sent: boolean;
}

export interface PartnerEmailOtpRequestResponse {
  sent: boolean;
  challenge_id: string;
  expires_in_seconds: number;
  resend_after_seconds: number;
  /**
   * Loyiha hali real email provayderga to'liq ulanmagan muhitlarda
   * (`ENABLE_DEMO_AUTH=true`) backend kodni bu yerda ham qaytaradi —
   * shunda tasdiqlash kodini haqiqiy emailga kirmasdan ko'rish mumkin.
   * Productionda bu maydon hech qachon kelmaydi.
   */
  dev_code?: string;
}

export interface PartnerEmailOtpVerifyDto {
  email: string;
  code: string;
  challenge_id: string;
}

/** SMS OTP yuborish so'rovi. */
export function requestOtp(phone: string): Promise<OtpRequestResponse> {
  return request<OtpRequestResponse>('/auth/otp/request', {
    method: 'POST',
    body: { phone },
  });
}

/** OTP'ni tekshirib, JWT tokenlarini olish. */
export function verifyOtp(dto: VerifyOtpDto): Promise<AuthTokens> {
  return request<AuthTokens>('/auth/otp/verify', {
    method: 'POST',
    body: dto,
  });
}

export interface PartnerLoginResponse extends AuthTokens {
  organization_id: string;
  organizationId?: string;
  organization_status?: string;
  organizationStatus?: string;
  partner_role: string;
}

export type PartnerPhoneLoginResponse = PartnerLoginResponse;
export type PartnerEmailLoginResponse = PartnerLoginResponse;

export function partnerPhoneLogin(
  phone: string,
): Promise<PartnerPhoneLoginResponse> {
  return request<PartnerPhoneLoginResponse>('/auth/partner/phone-login', {
    method: 'POST',
    body: { phone },
  });
}

export function requestPartnerEmailOtp(
  email: string,
): Promise<PartnerEmailOtpRequestResponse> {
  return request<PartnerEmailOtpRequestResponse>(
    '/auth/partner/email-otp/request',
    {
      method: 'POST',
      body: { email },
    },
  );
}

export function verifyPartnerEmailOtp(
  dto: PartnerEmailOtpVerifyDto,
): Promise<PartnerEmailLoginResponse> {
  return request<PartnerEmailLoginResponse>('/auth/partner/email-otp/verify', {
    method: 'POST',
    body: dto,
  });
}
