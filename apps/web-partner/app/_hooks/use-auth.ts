'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { access, auth } from '../_lib/api';
import { buildPartnerSession } from '../_lib/auth/session';
import { useAuthStore } from '../_stores/auth-store';

// ─── Demo rejim ───────────────────────────────────────────────────────────────
// Backend o'chiq bo'lganda ishlab chiqish uchun ishlatiladi.
// HECH QACHON production'ga chiqarma.
const DEMO_EMAIL = 'demo@safaar.uz';
const DEMO_CODE = '000000';
const DEMO_TOKENS = {
  accessToken: 'demo.eyJzdWIiOiJkZW1vLXVzZXIiLCJvcmdhbml6YXRpb25faWQiOiJkZW1vLW9yZyJ9.demo',
  refreshToken: 'demo-refresh-token',
  organization_id: 'demo-org-id',
  organizationId: 'demo-org-id',
  partner_role: 'owner',
};
// ─────────────────────────────────────────────────────────────────────────────

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

      // ── Demo rejim ──────────────────────────────────────────────────────────
      if (normalizedEmail === DEMO_EMAIL) {
        return {
          email: normalizedEmail,
          challengeId: 'demo-challenge-id',
          expiresInSeconds: 300,
          resendAfterSeconds: 60,
          partnerType: 'hotel',
        };
      }
      // ────────────────────────────────────────────────────────────────────────

      const accessStatus = await access
        .getPartnerAccessStatus({ email: normalizedEmail })
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
      } catch {
        // Backend o'chiq — demo rejimga o'tamiz
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
    onSuccess: ({ challengeId, email }) => {
      if (challengeId === 'demo-challenge-id') {
        toast.info(
          `Demo rejim: ${email === DEMO_EMAIL ? `"${DEMO_CODE}"` : '"000000"'} kodni kiriting`,
          { duration: 8000 },
        );
      } else {
        toast.success(
          '📧 Backend terminalida "MOCK EMAIL" ni toping va kodni kiriting',
          { duration: 8000 },
        );
      }
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

      // ── Demo rejim ──────────────────────────────────────────────────────────
      if (challengeId === 'demo-challenge-id') {
        if (code !== DEMO_CODE) {
          throw new Error(`Demo rejimda kod: ${DEMO_CODE}`);
        }
        return {
          email: normalizedEmail,
          tokens: DEMO_TOKENS,
          organizationId: 'demo-org-id',
          partnerType: partnerType || 'hotel',
          isDemo: true,
        };
      }
      // ────────────────────────────────────────────────────────────────────────

      const tokens = await auth.verifyPartnerEmailOtp({
        email: normalizedEmail,
        code,
        challenge_id: challengeId,
      });

      return {
        email: normalizedEmail,
        tokens,
        organizationId: tokens.organizationId ?? tokens.organization_id,
        partnerType: partnerType || 'hotel',
        isDemo: false,
      };
    },
    onSuccess: ({ email, tokens, organizationId, partnerType, isDemo }) => {
      const { user } = buildPartnerSession(email, tokens, partnerType, 'email');
      user.organizationId = organizationId;
      setSession(user, tokens);
      if (isDemo) {
        toast.success('Demo rejimda kirildingiz. Ma\'lumotlar ko\'rsatilmaydi.');
      } else {
        toast.success('Xush kelibsiz!');
      }
      router.replace('/');
    },
    onError: (error) => {
      toast.error(error.message || "Kod noto'g'ri yoki muddati tugagan");
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
