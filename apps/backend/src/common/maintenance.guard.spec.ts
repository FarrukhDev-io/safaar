import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { Role } from '@safaar/types';
import { signJwt } from '../auth/security';
import { AppCacheService } from '../infrastructure/cache.service';
import { PostgresService } from '../infrastructure/postgres.service';
import { MaintenanceGuard } from './maintenance.guard';

function contextFor(
  url: string,
  headers: Record<string, string> = {},
  method: string = 'GET',
): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        url,
        headers,
      }),
    }),
  } as unknown as ExecutionContext;
}

function wsContextFor(): ExecutionContext {
  return {
    getType: () => 'ws',
    switchToHttp: () => {
      throw new Error('switchToHttp should not be called for a ws context');
    },
  } as unknown as ExecutionContext;
}

describe('MaintenanceGuard', () => {
  let guard: MaintenanceGuard;
  let pgMock: jest.Mocked<Pick<PostgresService, 'query'>>;

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-with-32-characters';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-32-characters';
    pgMock = {
      query: jest.fn(),
    };
    guard = new MaintenanceGuard(
      {
        getOrSet: async <T>(
          _key: string,
          _ttl: number,
          factory: () => Promise<T> | T,
        ): Promise<T> => Promise.resolve(factory()),
      } as unknown as AppCacheService,
      pgMock as unknown as PostgresService,
    );
  });

  it('allows GET requests during maintenance mode (read-only browsing stays available)', async () => {
    pgMock.query.mockResolvedValue([{ maintenance_mode: true }]);

    await expect(guard.canActivate(contextFor('/v1/hotels'))).resolves.toBe(
      true,
    );
    expect(pgMock.query).not.toHaveBeenCalled();
  });

  it('blocks mutating requests when maintenance mode is enabled', async () => {
    pgMock.query.mockResolvedValue([{ maintenance_mode: true }]);

    await expect(
      guard.canActivate(contextFor('/v1/bookings', {}, 'POST')),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('allows mutating requests when maintenance mode is disabled', async () => {
    pgMock.query.mockResolvedValue([{ maintenance_mode: false }]);

    await expect(
      guard.canActivate(contextFor('/v1/bookings', {}, 'POST')),
    ).resolves.toBe(true);
  });

  it('allows admin endpoints during maintenance mode', async () => {
    await expect(
      guard.canActivate(contextFor('/v1/admin/settings', {}, 'PATCH')),
    ).resolves.toBe(true);
    expect(pgMock.query).not.toHaveBeenCalled();
  });

  it('allows public settings during maintenance mode', async () => {
    await expect(
      guard.canActivate(contextFor('/v1/settings/public')),
    ).resolves.toBe(true);
    expect(pgMock.query).not.toHaveBeenCalled();
  });

  it('allows user register/login endpoints during maintenance mode', async () => {
    pgMock.query.mockResolvedValue([{ maintenance_mode: true }]);

    await expect(
      guard.canActivate(contextFor('/v1/auth/user/login', {}, 'POST')),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(contextFor('/v1/auth/user/send-otp', {}, 'POST')),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(contextFor('/v1/auth/oauth/exchange', {}, 'POST')),
    ).resolves.toBe(true);
    expect(pgMock.query).not.toHaveBeenCalled();
  });

  it('still blocks partner auth and other mutations during maintenance mode', async () => {
    pgMock.query.mockResolvedValue([{ maintenance_mode: true }]);

    await expect(
      guard.canActivate(contextFor('/v1/auth/partner/login', {}, 'POST')),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('bypasses the guard entirely for non-HTTP (websocket/chat) contexts', async () => {
    pgMock.query.mockResolvedValue([{ maintenance_mode: true }]);

    await expect(guard.canActivate(wsContextFor())).resolves.toBe(true);
    expect(pgMock.query).not.toHaveBeenCalled();
  });

  it('allows admin actors to call non-admin endpoints during maintenance mode', async () => {
    const token = signJwt(
      {
        sub: '00000000-0000-0000-0000-000000000001',
        role: Role.SUPER_ADMIN,
        roles: [Role.SUPER_ADMIN],
        actor_type: 'admin',
        session_id: 'maintenance-admin-session',
        jti: 'maintenance-admin-jti',
      },
      'access',
    );

    await expect(
      guard.canActivate(
        contextFor(
          '/v1/notifications',
          { authorization: `Bearer ${token}` },
          'POST',
        ),
      ),
    ).resolves.toBe(true);
    expect(pgMock.query).not.toHaveBeenCalled();
  });
});
