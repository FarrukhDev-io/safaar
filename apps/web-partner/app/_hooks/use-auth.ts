'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { access, auth } from '../_lib/api';
import type { PartnerAccessStatus } from '../_lib/api/endpoints/access';
import type { PartnerLoginResponse } from '../_lib/api/endpoints/auth';
import { isLimitedPartnerAccessStatus } from '../_lib/auth/access-status';
import { buildPartnerSession } from '../_lib/auth/session';
import { useAuthStore } from '../_stores/auth-store';

const LOGIN_ALLOWED_STATUSES = new Set<PartnerAccessStatus>([
  'approved',
  'blocked',
  'suspended',
]);

function assertPartnerLoginAllowed(status: PartnerAccessStatus) {
  if (LOGIN_ALLOWED_STATUSES.has(status)) {
    return;
  }

  if (status === 'rejected') {
    throw new Error("Arizangiz rad etilgan. Admin bilan bog'laning.");
  }

  if (status === 'new' || status === 'reviewing' || status === 'submitted') {
    throw new Error('Arizangiz hali admin tomonidan tasdiqlanmagan.');
  }

  throw new Error(
    'Bu login uchun hamkorlik access topilmadi. Avval ariza yuboring.',
  );
}

function statusFromTokens(
  tokens: PartnerLoginResponse,
  fallback: PartnerAccessStatus,
): PartnerAccessStatus {
  return String(
    tokens.organizationStatus ?? tokens.organization_status ?? fallback,
  ) as PartnerAccessStatus;
}

export function usePartnerPhoneLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (phone: string) => {
      const accessStatus = await access.getPartnerAccessStatus(phone);
      assertPartnerLoginAllowed(accessStatus.status);

      const tokens = await auth.partnerPhoneLogin(phone);
      const partnerType = accessStatus.request?.type || 'hotel';
      return {
        phone,
        tokens,
        organizationId: tokens.organizationId ?? tokens.organization_id,
        partnerType,
        accessStatus: statusFromTokens(tokens, accessStatus.status),
      };
    },
    onSuccess: ({ phone, tokens, organizationId, partnerType, accessStatus }) => {
      const { user } = buildPartnerSession(phone, tokens, partnerType, 'phone');
      user.organizationId = organizationId;
      user.accessStatus = accessStatus;
      setSession(user, tokens);
      if (isLimitedPartnerAccessStatus(accessStatus)) {
        toast.warning("Access cheklangan. Profil va yordam bo'limi ochiq.");
        router.replace('/settings/profile');
        return;
      }
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
        .catch(() => {
          throw new Error("Hamkorlik access holatini tekshirib bo'lmadi.");
        });

      assertPartnerLoginAllowed(accessStatus.status);

      const challenge = await auth.requestPartnerEmailOtp(normalizedEmail);

      return {
        email: normalizedEmail,
        challengeId: challenge.challenge_id,
        expiresInSeconds: challenge.expires_in_seconds,
        resendAfterSeconds: challenge.resend_after_seconds,
        partnerType: accessStatus.request?.type || 'hotel',
        accessStatus: accessStatus.status,
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
      accessStatus,
    }: {
      email: string;
      code: string;
      challengeId: string;
      partnerType?: string;
      accessStatus?: PartnerAccessStatus;
    }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const tokens = await auth.verifyPartnerEmailOtp({
        email: normalizedEmail,
        code,
        challenge_id: challengeId,
      });

      const finalAccessStatus = statusFromTokens(
        tokens,
        accessStatus ?? 'approved',
      );

      return {
        email: normalizedEmail,
        tokens,
        organizationId:
          tokens.organizationId ?? tokens.organization_id ?? 'demo-org-id',
        partnerType: partnerType || 'hotel',
        accessStatus: finalAccessStatus,
      };
    },
    onSuccess: ({ email, tokens, organizationId, partnerType, accessStatus }) => {
      const { user } = buildPartnerSession(email, tokens, partnerType, 'email');
      user.organizationId = organizationId;
      user.accessStatus = accessStatus;
      setSession(user, tokens);
      if (isLimitedPartnerAccessStatus(accessStatus)) {
        toast.warning("Access cheklangan. Profil va yordam bo'limi ochiq.");
        router.replace('/settings/profile');
        return;
      }
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
