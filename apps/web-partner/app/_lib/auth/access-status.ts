export type LimitedPartnerAccessStatus = 'blocked' | 'suspended';

export function isLimitedPartnerAccessStatus(
  status: string | null | undefined,
): status is LimitedPartnerAccessStatus {
  return status === 'blocked' || status === 'suspended';
}

export function isLimitedPartnerRouteAllowed(pathname: string): boolean {
  return (
    pathname === '/settings/profile' ||
    pathname.startsWith('/settings/profile/') ||
    pathname === '/support' ||
    pathname.startsWith('/support/') ||
    pathname === '/logout'
  );
}
