import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@safaar/types';
import { verifyJwt } from '../auth/security';

export interface RequestActor {
  id: string;
  actorType: 'user' | 'partner' | 'admin';
  role: Role;
  roles: Role[];
  organizationId?: string;
  sessionId?: string;
}

export interface RequestWithActor {
  user?: RequestActor;
  headers: Record<string, string | string[] | undefined>;
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function buildActorFromHeaders(
  headers: RequestWithActor['headers'],
): RequestActor | undefined {
  const authorization = firstHeader(headers.authorization);
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined;

  if (!token) {
    return undefined;
  }

  const payload = verifyJwt(token, 'access');
  if (!payload) {
    return undefined;
  }

  return {
    id: payload.sub,
    actorType: payload.actor_type,
    role: payload.role,
    roles: payload.roles?.length ? payload.roles : [payload.role],
    organizationId: payload.organization_id ?? undefined,
    sessionId: payload.session_id,
  };
}

export const CurrentActor = createParamDecorator(
  (_: unknown, context: ExecutionContext): RequestActor | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithActor>();
    return request.user;
  },
);
