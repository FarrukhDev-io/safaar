'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMounted } from '../../_hooks/use-mounted';
import { isAccessTokenExpired } from '../../_lib/auth/session';
import { useAuthStore } from '../../_stores/auth-store';
import { Spinner } from '../ui/spinner';

export function AuthGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const clearSession = useAuthStore((s) => s.clearSession);
  const hydrated = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const sessionInvalid = !user || isAccessTokenExpired(accessToken);

  useEffect(() => {
    if (hydrated && sessionInvalid) {
      clearSession();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [clearSession, hydrated, pathname, router, sessionInvalid]);

  if (!hydrated || sessionInvalid) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[var(--background)]"
        role="status"
        aria-label="Sahifa tayyorlanmoqda"
      >
        <Spinner size="lg" label="Sahifa tayyorlanmoqda" />
      </div>
    );
  }

  return <>{children}</>;
}
