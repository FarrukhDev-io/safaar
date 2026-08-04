'use client';

import { useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useMounted } from '../../_hooks/use-mounted';
import { access } from '../../_lib/api';
import {
  isLimitedPartnerAccessStatus,
  isLimitedPartnerRouteAllowed,
} from '../../_lib/auth/access-status';
import { isAccessTokenExpired } from '../../_lib/auth/session';
import { useAuthStore } from '../../_stores/auth-store';
import { Spinner } from '../ui/spinner';

export function AuthGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const hydrated = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const sessionInvalid = !user || isAccessTokenExpired(accessToken);
  const accessLookup = user?.email
    ? { email: user.email }
    : user?.phone
      ? user.phone
      : null;
  const accessStatusQuery = useQuery({
    queryKey: ['partner', 'access-status', accessLookup],
    queryFn: () => access.getPartnerAccessStatus(accessLookup ?? ''),
    enabled: hydrated && !sessionInvalid && Boolean(accessLookup),
    retry: 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const accessStatus = accessStatusQuery.data?.status ?? user?.accessStatus;
  const limitedAccess = isLimitedPartnerAccessStatus(accessStatus);
  const limitedRouteAllowed = isLimitedPartnerRouteAllowed(pathname);
  const accessChecking =
    Boolean(accessLookup) &&
    !user?.accessStatus &&
    accessStatusQuery.isPending;

  useEffect(() => {
    if (hydrated && sessionInvalid) {
      clearSession();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [clearSession, hydrated, pathname, router, sessionInvalid]);

  useEffect(() => {
    const data = accessStatusQuery.data;
    if (!data) return;

    updateUser({
      accessStatus: data.status,
      partnerType: data.request?.type ?? user?.partnerType,
    });
  }, [accessStatusQuery.data, updateUser, user?.partnerType]);

  useEffect(() => {
    if (!hydrated || sessionInvalid || !limitedAccess || limitedRouteAllowed) {
      return;
    }

    router.replace('/settings/profile');
  }, [
    hydrated,
    limitedAccess,
    limitedRouteAllowed,
    router,
    sessionInvalid,
  ]);

  if (
    !hydrated ||
    sessionInvalid ||
    accessChecking ||
    (limitedAccess && !limitedRouteAllowed)
  ) {
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
