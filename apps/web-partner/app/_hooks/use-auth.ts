'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { access, auth } from '../_lib/api';
import type { PartnerAccessStatus } from '../_lib/api/endpoints/access';
import type { PartnerLoginResponse } from '../_lib/api/endpoints/auth';
import { isLimitedPartnerAccessStatus } from '../_lib/auth/access-status';
import { buildPartnerSession } from '../_lib/auth/session';
import { useAuthStore } from '../_stores/auth-store';
import { useDataStore } from '../_stores/data-store';

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

// ─── Demo rejim ───────────────────────────────────────────────────────────────
// Backend o'chiq bo'lganda ishlab chiqish uchun ishlatiladi.
// HECH QACHON production'ga chiqarma.
const DEMO_PHONE = '+998901234567';
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
  const resetData = useDataStore((s) => s.reset);
  const queryClient = useQueryClient();

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
      // Oldingi sessiyadan (masalan boshqa tashkilot bilan chiqmasdan,
      // to'g'ridan-to'g'ri /login orqali) qolgan kesh/ma'lumot yangi
      // login'ning o'zida ko'rinib qolmasligi uchun — xuddi `useLogout()`
      // qanday tozalasa shunday, lekin bu safar KIRISH paytida.
      resetData();
      queryClient.clear();
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

export function usePartnerPhoneOtpRequest() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const normalizedPhone = phone.replace(/\D/g, '');

      // ── Demo rejim ──────────────────────────────────────────────────────────
      if (phone === DEMO_PHONE || normalizedPhone === '998901234567') {
        return {
          phone,
          challengeId: 'demo-challenge-id',
          expiresInSeconds: 300,
          resendAfterSeconds: 60,
          partnerType: 'hotel',
        };
      }
      // ────────────────────────────────────────────────────────────────────────

      const accessStatus = await access
        .getPartnerAccessStatus({ phone })
        .catch(() => ({ status: 'approved' as const, request: { type: 'hotel' } }));

      assertPartnerLoginAllowed(accessStatus.status);

      let challenge;
      try {
        challenge = await auth.requestOtp(phone);
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
        phone,
        challengeId: challenge.challenge_id,
        expiresInSeconds: challenge.expires_in_seconds,
        resendAfterSeconds: challenge.resend_after_seconds,
        partnerType: accessStatus.request?.type || 'hotel',
        accessStatus: accessStatus.status,
        devCode: challenge.dev_code,
      };
    },
    onSuccess: ({ challengeId, phone }) => {
      if (challengeId === 'demo-challenge-id') {
        toast.info(
          `Demo rejim: ${phone === DEMO_PHONE ? `"${DEMO_CODE}"` : '"000000"'} kodni kiriting`,
          { duration: 8000 },
        );
      } else {
        toast.success(
          '📱 SMS orqali kod yuborildi',
          { duration: 4000 },
        );
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Kod yuborishda xatolik yuz berdi');
    },
  });
}


export function usePartnerPhoneOtpVerify() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const resetData = useDataStore((s) => s.reset);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      phone,
      code,
      challengeId,
      partnerType,
      accessStatus,
    }: {
      phone: string;
      code: string;
      challengeId: string;
      partnerType?: string;
      accessStatus?: PartnerAccessStatus;
    }) => {
      // ── Demo rejim ──────────────────────────────────────────────────────────
      if (challengeId === 'demo-challenge-id') {
        if (code !== DEMO_CODE) {
          throw new Error(`Demo rejimda kod: ${DEMO_CODE}`);
        }
        return {
          phone,
          tokens: DEMO_TOKENS as any,
          organizationId: 'demo-org-id',
          partnerType: partnerType || 'hotel',
          accessStatus: accessStatus ?? 'approved',
          isDemo: true,
        };
      }
      // ────────────────────────────────────────────────────────────────────────

      const tokens = await auth.verifyOtp({
        phone,
        code,
        challenge_id: challengeId,
      }) as any;

      return {
        phone,
        tokens,
        organizationId: tokens.organizationId ?? tokens.organization_id,
        partnerType: partnerType || 'hotel',
        accessStatus: statusFromTokens(tokens, accessStatus ?? 'approved'),
        isDemo: false,
      };
    },
    onSuccess: ({ phone, tokens, organizationId, partnerType, accessStatus, isDemo }) => {
      resetData();
      queryClient.clear();
      const { user } = buildPartnerSession(phone, tokens, partnerType, 'phone');
      user.organizationId = organizationId;
      user.accessStatus = accessStatus;
      setSession(user, tokens);
      if (isLimitedPartnerAccessStatus(accessStatus)) {
        toast.warning("Access cheklangan. Profil va yordam bo'limi ochiq.");
        router.replace('/settings/profile');
        return;
      }
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
  const resetData = useDataStore((s) => s.reset);
  const queryClient = useQueryClient();

  return () => {
    clearSession();
    resetData();
    // Boshqa hamkor tashkilotga (masalan boshqa biznes turi bilan) qayta
    // kirilganda oldingi tashkilotning keshlangan e'lon/xona/bron
    // ma'lumotlari ko'rinib qolmasligi uchun — session-expiry-handler.tsx
    // avtomatik chiqishda buni allaqachon to'g'ri qilardi, qo'lda
    // "Chiqish" tugmasida esa yetishmayotgan edi.
    queryClient.clear();
    toast.success('Sessiya yakunlandi');
    router.replace('/login');
  };
}
