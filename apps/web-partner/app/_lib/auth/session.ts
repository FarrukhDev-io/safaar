import type { AuthTokens } from '@safaar/types';
import { Role } from '@safaar/types';
import type { PartnerAccessStatus } from '../api/endpoints/access';
import type { AuthUser } from '../../_stores/auth-store';

type PartnerSessionTokens = AuthTokens & {
  organization_id?: string;
  organizationId?: string;
  organization_status?: string;
  organizationStatus?: string;
};

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split('.');
  if (!payload) return {};
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function isAccessTokenExpired(
  token: string | undefined,
  skewMs = 30_000,
): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  const exp = payload.exp;
  if (typeof exp !== 'number') return false;
  return Date.now() + skewMs >= exp * 1000;
}

export function buildPartnerSession(
  contact: string,
  tokens: PartnerSessionTokens,
  partnerType?: string,
  contactType: 'email' | 'phone' = 'email',
): { user: AuthUser; tokens: AuthTokens } {
  const payload = decodeJwtPayload(tokens.accessToken);
  const id = typeof payload.sub === 'string' ? payload.sub : contact;
  let organizationId: string | undefined;
  if (typeof tokens.organizationId === 'string') {
    organizationId = tokens.organizationId;
  } else if (typeof tokens.organization_id === 'string') {
    organizationId = tokens.organization_id;
  } else if (typeof payload.organization_id === 'string') {
    organizationId = payload.organization_id;
  }
  const accessStatus = String(
    tokens.organizationStatus ?? tokens.organization_status ?? 'approved',
  ) as PartnerAccessStatus;

  return {
    user: {
      id,
      phone: contactType === 'phone' ? contact : '',
      email: contactType === 'email' ? contact : undefined,
      fullName: 'Hamkor xodimi',
      role: Role.PARTNER,
      organizationId,
      partnerType: partnerType || 'hotel',
      accessStatus,
    },
    tokens,
  };
}
