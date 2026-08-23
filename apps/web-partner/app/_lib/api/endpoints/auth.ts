import type { AuthTokens, VerifyOtpDto } from '@safaar/types';
import { request } from '../client';

export interface OtpRequestResponse {
  sent: boolean;
  challenge_id: string;
  expires_in_seconds: number;
  resend_after_seconds: number;
  dev_code?: string;
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

export function partnerPhoneLogin(
  phone: string,
): Promise<PartnerPhoneLoginResponse> {
  return request<PartnerPhoneLoginResponse>('/auth/partner/phone-login', {
    method: 'POST',
    body: { phone },
  });
}

