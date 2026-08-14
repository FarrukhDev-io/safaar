import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@safaar/types';
import { signJwt } from '../auth/security';
import { PostgresService } from '../infrastructure/postgres.service';
import { RolesGuard } from './roles.guard';

jest.mock('../auth/session-store', () => ({
  authSessionStore: { isActive: jest.fn().mockResolvedValue(true) },
}));

function contextFor(
  headers: Record<string, string> = {},
  overrides: { requiredRoles?: Role[]; requiredPermissions?: string[] } = {},
): { context: ExecutionContext; request: { user?: unknown; headers: Record<string, string> } } {
  const request: { user?: unknown; headers: Record<string, string> } = {
    headers,
  };
  const context = {
    getHandler: () => ({ __roles: overrides.requiredRoles }),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('RolesGuard — optional-auth actor resolution (regression: guest-checkout booking user_id null)', () => {
  let guard: RolesGuard;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>>;
  let reflector: { getAllAndOverride: jest.Mock };

  const userToken = () =>
    signJwt(
      {
        sub: '00000000-0000-0000-0000-000000000001',
        role: Role.USER,
        roles: [Role.USER],
        actor_type: 'user',
        session_id: 'session-1',
        jti: 'jti-1',
      },
      'access',
    );

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-with-32-characters';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-32-characters';
    pg = { query: jest.fn() };
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) };
    guard = new RolesGuard(
      reflector as unknown as Reflector,
      pg as unknown as PostgresService,
    );
  });

  it('populates request.user from a valid token even when no @Roles() is required (guest-checkout route)', async () => {
    const token = userToken();
    pg.query.mockResolvedValueOnce([{ status: 'active' }]); // users status check

    const { context, request } = contextFor({ authorization: `Bearer ${token}` });
    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(request.user).toMatchObject({
      id: '00000000-0000-0000-0000-000000000001',
      actorType: 'user',
    });
  });

  it('leaves request.user undefined (proceeds as guest) when no token is sent on an optional-auth route', async () => {
    const { context, request } = contextFor({});
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
    expect(pg.query).not.toHaveBeenCalled();
  });

  it('degrades to guest (no hard error) when the token belongs to a blocked user on an optional-auth route', async () => {
    const token = userToken();
    pg.query.mockResolvedValueOnce([{ status: 'blocked' }]);

    const { context, request } = contextFor({ authorization: `Bearer ${token}` });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  it('still enforces roles/permissions normally when @Roles() IS present (no regression)', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce([Role.PARTNER]).mockReturnValueOnce(undefined);
    const token = userToken(); // actor is a plain USER, not PARTNER
    pg.query.mockResolvedValueOnce([{ status: 'active' }]);

    const { context } = contextFor({ authorization: `Bearer ${token}` });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('still rejects a missing token when @Roles() IS required (no regression)', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce([Role.USER]).mockReturnValueOnce(undefined);
    const { context } = contextFor({});
    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: 401,
    });
  });
});
