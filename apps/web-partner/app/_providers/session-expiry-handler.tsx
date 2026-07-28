'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setUnauthorizedHandler } from '../_lib/api/client';
import { AUTH_STORAGE_KEY, useAuthStore } from '../_stores/auth-store';

function currentPath() {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}

export function SessionExpiryHandler() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const redirecting = useRef(false);

  useEffect(() => {
    redirecting.current = false;
  }, [pathname]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (redirecting.current) return;
      redirecting.current = true;

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
      router.replace(
        next.startsWith('/login')
          ? '/login'
          : `/login?next=${encodeURIComponent(next)}`,
      );
    });

    return () => setUnauthorizedHandler(null);
  }, [clearSession, queryClient, router]);

  return null;
}
