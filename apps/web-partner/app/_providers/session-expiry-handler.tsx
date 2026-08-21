'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isLoggingOut, setAccessTokenUpdater, setLoggingOut, setUnauthorizedHandler } from '../_lib/api/client';
import { AUTH_STORAGE_KEY, useAuthStore } from '../_stores/auth-store';

function currentPath() {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}

export function SessionExpiryHandler() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const hasTokens = useAuthStore((s) => Boolean(s.tokens?.accessToken));
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const redirecting = useRef(false);

  useEffect(() => {
    redirecting.current = false;
  }, [pathname]);

  useEffect(() => {
    setAccessTokenUpdater(setAccessToken);
    return () => setAccessTokenUpdater(null);
  }, [setAccessToken]);

  // Zustand'da access token yo'q (masalan yangi tab/brauzer profili), lekin
  // httpOnly refresh-token cookie hali amal qilishi mumkin — sahifa
  // ochilganda jimgina tiklab ko'ramiz, aks holda foydalanuvchi haqiqiy
  // sessiyasi bo'la turib chiqib ketilgan bo'lib ko'rinardi.
  useEffect(() => {
    if (hasTokens || isLoggingOut()) return;
    let cancelled = false;
    fetch('/api/auth/refresh', { method: 'POST' })
      .then(async (res) => {
        if (cancelled || !res.ok) return;
        const data = (await res.json().catch(() => null)) as
          | { accessToken?: string }
          | null;
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
        }
      })
      .catch(() => {
        // cookie yo'q/yaroqsiz — oddiy "chiqilgan" holat, xato emas.
      });
    return () => {
      cancelled = true;
    };
    // Faqat mount'da (yoki tokens yo'qolganda) bir marta urinamiz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTokens]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (redirecting.current) return;
      redirecting.current = true;
      setLoggingOut(true);

      clearSession();
      queryClient.clear();

      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // localStorage unavailable bo'lsa ham redirect davom etadi.
      }

      const next = currentPath();
      if (!next.startsWith('/login')) {
        toast.error('Sessiya muddati tugadi. Qayta kiring.');
      }
      const target = next.startsWith('/login')
        ? '/login'
        : `/login?next=${encodeURIComponent(next)}`;

      // Cookie tozalanishini navigatsiyadan oldin kutamiz (real E2E orqali
      // topilgan poyga holati — fire-and-forget bo'lsa, so'rov hali
      // yuborilmagan holatda sahifa allaqachon o'zgarib ketishi mumkin edi).
      fetch('/api/auth/logout', { method: 'POST' })
        .catch(() => {
          // cookie tozalanmasa ham redirect davom etadi.
        })
        .finally(() => {
          router.replace(target);
        });
    });

    return () => setUnauthorizedHandler(null);
  }, [clearSession, queryClient, router]);

  return null;
}
