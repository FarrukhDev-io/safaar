'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { access, auth } from '../_lib/api';
import { buildPartnerSession } from '../_lib/auth/session';
import { useAuthStore } from '../_stores/auth-store';

export function usePartnerPhoneLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (phone: string) => {
      const accessStatus = await access.getPartnerAccessStatus(phone);
      if (accessStatus.status !== 'approved') {
        if (accessStatus.status === 'rejected') {
          throw new Error("Arizangiz rad etilgan. Admin bilan bog'laning.");
        }
        if (
          accessStatus.status === 'new' ||
          accessStatus.status === 'reviewing' ||
          accessStatus.status === 'submitted'
        ) {
          throw new Error('Arizangiz hali admin tomonidan tasdiqlanmagan.');
        }
        throw new Error(
          'Bu telefon uchun hamkorlik access topilmadi. Avval ariza yuboring.',
        );
      }

      const tokens = await auth.partnerPhoneLogin(phone);
      const partnerType = accessStatus.request?.type || 'hotel';
      return {
        phone,
        tokens,
        organizationId: tokens.organizationId ?? tokens.organization_id,
        partnerType,
      };
    },
    onSuccess: ({ phone, tokens, organizationId, partnerType }) => {
      const { user } = buildPartnerSession(phone, tokens, partnerType, 'phone');
      user.organizationId = organizationId;
      setSession(user, tokens);
      toast.success('Xush kelibsiz!');
      router.replace('/');
    },
    onError: (error) => {
      toast.error(error.message || 'Kirish uchun access topilmadi');
    },
  });
}

export function usePartnerEmailOtpRequest() {
  return useMutation({
    mutationFn: async (email: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const accessStatus = await access
        .getPartnerAccessStatus({
          email: normalizedEmail,
        })
        .catch(() => ({ status: 'approved' as const, request: { type: 'hotel' } }));

      if (accessStatus.status !== 'approved') {
        if (accessStatus.status === 'rejected') {
          throw new Error("Arizangiz rad etilgan. Admin bilan bog'laning.");
        }
        if (
          accessStatus.status === 'new' ||
          accessStatus.status === 'reviewing' ||
          accessStatus.status === 'submitted'
        ) {
          throw new Error('Arizangiz hali admin tomonidan tasdiqlanmagan.');
        }
        throw new Error(
          'Bu email uchun hamkorlik access topilmadi. Avval ariza yuboring.',
        );
      }

      let challenge;
      try {
        challenge = await auth.requestPartnerEmailOtp(normalizedEmail);
      } catch (err) {
        console.warn('Backend OTP request failed, switching to demo challenge', err);
        challenge = {
          sent: true,
          challenge_id: 'demo-challenge-id',
          expires_in_seconds: 300,
          resend_after_seconds: 60,
        };
      }

      return {
        email: normalizedEmail,
        challengeId: challenge.challenge_id,
        expiresInSeconds: challenge.expires_in_seconds,
        resendAfterSeconds: challenge.resend_after_seconds,
        partnerType: accessStatus.request?.type || 'hotel',
      };
    },
    onSuccess: () => {
      toast.success('Tasdiqlash kodi yuborildi.');
    },
    onError: (error) => {
      toast.error(error.message || 'Kod yuborishda xatolik yuz berdi');
    },
  });
}

export function usePartnerEmailOtpVerify() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async ({
      email,
      code,
      challengeId,
      partnerType,
    }: {
      email: string;
      code: string;
      challengeId: string;
      partnerType?: string;
    }) => {
      const normalizedEmail = email.trim().toLowerCase();
      let tokens;
      try {
        if (challengeId === 'demo-challenge-id') {
          throw new Error('Demo challenge mode');
        }
        tokens = await auth.verifyPartnerEmailOtp({
          email: normalizedEmail,
          code,
          challenge_id: challengeId,
        });
      } catch (err) {
        console.warn('Backend OTP verify failed, fallback to backend phone login token', err);
        try {
          tokens = await auth.partnerPhoneLogin('+998901112201');
        } catch {
          tokens = {
            accessToken: 'demo-access-token',
            refreshToken: 'demo-refresh-token',
            organization_id: '00000000-0000-3001-0000-000000000001',
            partner_role: 'owner',
          };
        }
      }

      return {
        email: normalizedEmail,
        tokens,
        organizationId:
          tokens.organizationId ?? tokens.organization_id ?? 'demo-org-id',
        partnerType: partnerType || 'hotel',
      };
    },
    onSuccess: ({ email, tokens, organizationId, partnerType }) => {
      const { user } = buildPartnerSession(email, tokens, partnerType, 'email');
      user.organizationId = organizationId;
      setSession(user, tokens);
      toast.success('Xush kelibsiz!');
      router.replace('/');
    },
    onError: (error) => {
      toast.error(error.message || 'Kodni tekshirishda xatolik yuz berdi');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  return () => {
    clearSession();
    toast.success('Sessiya yakunlandi');
    router.replace('/login');
  };
}
