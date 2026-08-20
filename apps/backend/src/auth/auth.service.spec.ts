import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  PostgresService,
  PostgresTransaction,
} from '../infrastructure/postgres.service';
import type { JobQueueService } from '../infrastructure/job-queue.service';
import type { EmailService } from '../infrastructure/email.service';
import type { SmsService } from '../infrastructure/sms.service';
import type { AppCacheService } from '../infrastructure/cache.service';
import type { EmailMessage } from '../integrations/email/email-provider.interface';
import { authSessionStore } from './session-store';
import * as totp from './totp';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService email and OAuth', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const pg = {
    query: jest.fn(),
    transaction: jest.fn(),
  };
  const jobs = { add: jest.fn() };
  const sentMessages: EmailMessage[] = [];
  const email = { send: jest.fn() };
  const sms = { send: jest.fn() };
  const cache = {
    get: jest.fn(),
    set: jest.fn(),
    take: jest.fn(),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'google-client';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
    process.env.GOOGLE_CALLBACK_URL =
      'http://localhost:4000/v1/auth/google/callback';
    delete process.env.FACEBOOK_APP_ID;
    delete process.env.FACEBOOK_APP_SECRET;
    process.env.FACEBOOK_CALLBACK_URL =
      'http://localhost:4000/v1/auth/facebook/callback';
    sentMessages.length = 0;
    email.send.mockImplementation((message: EmailMessage) => {
      sentMessages.push(message);
      return Promise.resolve({ accepted: true });
    });
    sms.send.mockResolvedValue({ accepted: true, providerMessageId: '' });
    jobs.add.mockResolvedValue(undefined);
    cache.set.mockResolvedValue(undefined);
    service = new AuthService(
      pg as unknown as PostgresService,
      jobs as unknown as JobQueueService,
      email as unknown as EmailService,
      sms as unknown as SmsService,
      cache as unknown as AppCacheService,
    );
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('requires a valid email before creating an OTP challenge', async () => {
    await expect(
      service.sendUserEmailOtp('not-an-email'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(email.send).not.toHaveBeenCalled();
  });

  it('creates and sends an email OTP challenge', async () => {
    const result = await service.sendUserEmailOtp(' USER@EXAMPLE.COM ');

    expect(result.sent).toBe(true);
    expect(result.challenge_id).toEqual(expect.any(String));
    expect(result).not.toHaveProperty('dev_code');
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
      }),
    );
    expect(sentMessages[0]?.text).toMatch(/\b\d{6}\b/);
    expect(jobs.add).not.toHaveBeenCalled();
  });

  it('does not report an OTP as sent when the provider rejects it', async () => {
    email.send.mockResolvedValueOnce({ accepted: false });

    await expect(
      service.sendUserEmailOtp('rejected@example.com'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('turns an SMTP send failure into EMAIL_DELIVERY_FAILED (503), not a raw 500 (regression: M-5)', async () => {
    email.send.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(
      service.sendUserEmailOtp('smtp-down@example.com'),
    ).rejects.toMatchObject({
      status: 503,
      response: expect.objectContaining({ code: 'EMAIL_DELIVERY_FAILED' }),
    });
  });

  it('turns an SMTP send failure into EMAIL_DELIVERY_FAILED for the partner OTP path too', async () => {
    pg.query.mockResolvedValueOnce([
      {
        id: '00000000-0000-4000-8000-000000000010',
        organization_status: 'approved',
      },
    ]);
    email.send.mockRejectedValueOnce(new Error('ETIMEDOUT'));

    await expect(
      service.sendPartnerEmailOtp('partner-smtp-down@example.com'),
    ).rejects.toMatchObject({
      status: 503,
      response: expect.objectContaining({ code: 'EMAIL_DELIVERY_FAILED' }),
    });
  });

  it('does not report a partner OTP as sent when the provider rejects it', async () => {
    pg.query.mockResolvedValueOnce([
      {
        id: '00000000-0000-4000-8000-000000000010',
        organization_status: 'approved',
      },
    ]);
    email.send.mockResolvedValueOnce({ accepted: false });

    await expect(
      service.sendPartnerEmailOtp('partner@example.com'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(jobs.add).not.toHaveBeenCalled();
  });

  it('rejects a partner email login when the OTP code is invalid', async () => {
    pg.query.mockResolvedValueOnce([
      {
        id: '00000000-0000-4000-8000-000000000010',
        organization_status: 'approved',
      },
    ]);
    const challenge = await service.sendPartnerEmailOtp('partner@example.com');
    const createSession = jest
      .spyOn(authSessionStore, 'create')
      .mockResolvedValue({} as never);

    await expect(
      service.verifyPartnerEmailOtp({
        email: 'partner@example.com',
        code: '000000',
        challenge_id: challenge.challenge_id,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(pg.query).toHaveBeenCalledTimes(1);
    expect(createSession).not.toHaveBeenCalled();
  });

  it('does not issue partner tokens through phone login without OTP', async () => {
    const createSession = jest
      .spyOn(authSessionStore, 'create')
      .mockResolvedValue({} as never);

    await expect(
      service.partnerPhoneLogin({ phone: '+998901112201' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(pg.query).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it('verifies an email OTP and issues a user session', async () => {
    const challenge = await service.sendUserEmailOtp('login@example.com');
    const sentMessage = sentMessages[0];
    const code = sentMessage?.text?.match(/\b\d{6}\b/)?.[0];
    expect(code).toBeDefined();
    pg.query.mockResolvedValueOnce([
      {
        id: '00000000-0000-4000-8000-000000000002',
        email: 'login@example.com',
        first_name: 'Login',
        last_name: null,
        status: 'active',
      },
    ]);
    jest.spyOn(authSessionStore, 'create').mockResolvedValue({} as never);

    const result = await service.verifyUserEmailOtp({
      email: 'login@example.com',
      code: String(code),
      challenge_id: challenge.challenge_id,
    });

    expect(result.user).toEqual({
      id: '00000000-0000-4000-8000-000000000002',
      email: 'login@example.com',
      firstName: 'Login',
      lastName: null,
    });
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
  });

  it('advertises only fully configured OAuth providers', () => {
    expect(service.oauthProviders()).toEqual({
      google: true,
      facebook: false,
    });
  });

  it('creates a state-bound Google authorization redirect', async () => {
    const result = await service.oauthRedirect('google', {
      locale: 'ru',
      next: '/ru/account',
    });
    const redirect = new URL(result.redirectUrl);

    expect(redirect.origin).toBe('https://accounts.google.com');
    expect(redirect.searchParams.get('state')).toBe(result.state);
    expect(redirect.searchParams.get('redirect_uri')).toBe(
      process.env.GOOGLE_CALLBACK_URL,
    );
    expect(cache.set).toHaveBeenCalledWith(
      expect.stringContaining('auth:oauth:state:'),
      { provider: 'google', locale: 'ru', next: '/ru/account' },
      600,
    );
  });

  it('rejects an OAuth callback with a mismatched state cookie', async () => {
    await expect(
      service.oauthCallback(
        'google',
        { state: 'request-state', code: 'provider-code' },
        'other-state',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(cache.take).not.toHaveBeenCalled();
  });

  it('verifies a Google callback and creates a one-time exchange code', async () => {
    cache.take.mockResolvedValueOnce({
      provider: 'google',
      locale: 'uz',
      next: '/uz/account',
    });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'provider-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sub: 'google-user',
            email: 'user@example.com',
            email_verified: true,
            given_name: 'Test',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
    const transaction = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: '00000000-0000-4000-8000-000000000001',
            status: 'active',
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    } as unknown as PostgresTransaction;
    pg.transaction.mockImplementation(
      (operation: (value: PostgresTransaction) => Promise<unknown>) =>
        operation(transaction),
    );

    const result = await service.oauthCallback(
      'google',
      { state: 'valid-state', code: 'provider-code' },
      'valid-state',
    );

    expect(typeof result.code).toBe('string');
    expect(result.locale).toBe('uz');
    expect(result.next).toBe('/uz/account');
    expect(cache.set).toHaveBeenLastCalledWith(
      expect.stringContaining('auth:oauth:exchange:'),
      { userId: '00000000-0000-4000-8000-000000000001' },
      60,
    );
  });

  it('rejects a Google callback when the email is not registered', async () => {
    cache.take.mockResolvedValueOnce({
      provider: 'google',
      locale: 'uz',
      next: '',
    });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'provider-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sub: 'google-new-user',
            email: 'new-user@example.com',
            email_verified: true,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
    const transaction = {
      query: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]),
    } as unknown as PostgresTransaction;
    pg.transaction.mockImplementation(
      (operation: (value: PostgresTransaction) => Promise<unknown>) =>
        operation(transaction),
    );

    await expect(
      service.oauthCallback(
        'google',
        { state: 'valid-state', code: 'provider-code' },
        'valid-state',
      ),
    ).rejects.toMatchObject({
      response: {
        code: 'OAUTH_ACCOUNT_NOT_REGISTERED',
      },
    });
    expect(cache.set).not.toHaveBeenCalled();
  });
});

describe('AuthService admin 2FA (regression: BUG-05 recovery_code_hashes column does not exist)', () => {
  const pg = { query: jest.fn(), transaction: jest.fn() };
  const jobs = { add: jest.fn() };
  const email = { send: jest.fn() };
  const sms = { send: jest.fn() };
  const cache = { get: jest.fn(), set: jest.fn(), take: jest.fn() };
  let service: AuthService;
  const adminActor = {
    id: 'admin-1',
    actorType: 'admin' as const,
    role: 'SUPER_ADMIN' as never,
    roles: [] as never[],
    sessionId: 'session-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    pg.query.mockResolvedValue([{ id: 'admin-1', email: 'admin@safaar.uz' }]);
    pg.transaction.mockImplementation(
      (operation: (tx: PostgresTransaction) => unknown) =>
        operation({ query: pg.query }),
    );
    jest.spyOn(authSessionStore, 'revokeActor').mockResolvedValue(1);
    service = new AuthService(
      pg as unknown as PostgresService,
      jobs as unknown as JobQueueService,
      email as unknown as EmailService,
      sms as unknown as SmsService,
      cache as unknown as AppCacheService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('admin2faSetup does not query the non-existent recovery_code_hashes column', async () => {
    const result = await service.admin2faSetup(adminActor);

    expect(result.setup_id).toBeDefined();
    expect(result.recovery_codes).toHaveLength(8);
    const [sql] = pg.query.mock.calls[0]!;
    expect(sql).not.toContain('recovery_code_hashes');
  });

  it('admin2faConfirm writes totp_secret to admin_users and recovery codes to admin_recovery_codes (not a nonexistent column)', async () => {
    jest.spyOn(totp, 'verifyTotpCode').mockReturnValue(true);

    const setup = await service.admin2faSetup(adminActor);
    pg.query.mockClear();

    const result = await service.admin2faConfirm(adminActor, {
      setup_id: setup.setup_id,
      code: '123456',
    });

    expect(result).toEqual({ enabled: true });
    expect(pg.transaction).toHaveBeenCalledTimes(1);

    const calls = pg.query.mock.calls;
    // calls[0] = pre-check SELECT; calls[1..3] = tranzaksiya ichidagi so'rovlar.
    expect(calls[1]![0]).toContain('UPDATE admin_users');
    expect(calls[1]![0]).not.toContain('recovery_code_hashes');
    expect(calls[2]![0]).toContain('DELETE FROM admin_recovery_codes');
    expect(calls[3]![0]).toContain('INSERT INTO admin_recovery_codes');
    // 8 ta recovery kod, har biri (admin_id, code_hash) — 16 ta parametr.
    expect((calls[3]![1] as unknown[]).length).toBe(16);
  });

  it('admin2faConfirm rejects an invalid TOTP code and writes nothing', async () => {
    jest.spyOn(totp, 'verifyTotpCode').mockReturnValue(false);

    const setup = await service.admin2faSetup(adminActor);
    pg.query.mockClear();

    await expect(
      service.admin2faConfirm(adminActor, {
        setup_id: setup.setup_id,
        code: '000000',
      }),
    ).rejects.toMatchObject({ status: 401 });
    expect(pg.transaction).not.toHaveBeenCalled();
  });

  it('admin2faDisable clears totp_secret and deletes recovery codes (not a nonexistent column)', async () => {
    const result = await service.admin2faDisable(adminActor);

    expect(result).toEqual({ disabled: true, sessions_revoked: true });
    const calls = pg.query.mock.calls;
    expect(calls[1]![0]).toContain('UPDATE admin_users');
    expect(calls[1]![0]).not.toContain('recovery_code_hashes');
    expect(calls[2]![0]).toContain('DELETE FROM admin_recovery_codes');
  });
});

describe('AuthService login lockout (HIGH: no minimum password length / no login throttle / no account lockout)', () => {
  const pg = { query: jest.fn(), transaction: jest.fn() };
  const jobs = { add: jest.fn() };
  const email = { send: jest.fn() };
  const sms = { send: jest.fn() };
  let store: Map<string, { value: unknown; expiresAt: number }>;
  const cache = {
    get: jest.fn((key: string) => {
      const entry = store.get(key);
      if (!entry || entry.expiresAt < Date.now()) {
        return Promise.resolve(undefined);
      }
      return Promise.resolve(entry.value);
    }),
    set: jest.fn((key: string, value: unknown, ttlSeconds: number) => {
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
      return Promise.resolve(undefined);
    }),
    del: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve(undefined);
    }),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    (argon2.verify as jest.Mock).mockReset();
    store = new Map();
    pg.transaction.mockImplementation(
      (operation: (tx: PostgresTransaction) => unknown) =>
        operation({ query: pg.query }),
    );
    jest.spyOn(authSessionStore, 'create').mockResolvedValue({} as never);
    service = new AuthService(
      pg as unknown as PostgresService,
      jobs as unknown as JobQueueService,
      email as unknown as EmailService,
      sms as unknown as SmsService,
      cache as unknown as AppCacheService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('locks out user login after 5 failed attempts for the same email', async () => {
    pg.query.mockResolvedValue([]);

    for (let i = 0; i < 5; i += 1) {
      await expect(
        service.userLogin({ email: 'victim@safaar.uz', password: 'wrong' }),
      ).rejects.toMatchObject({
        status: 401,
        response: expect.objectContaining({ code: 'AUTH_INVALID_CREDENTIALS' }),
      });
    }

    await expect(
      service.userLogin({ email: 'victim@safaar.uz', password: 'wrong' }),
    ).rejects.toMatchObject({
      status: 401,
      response: expect.objectContaining({ code: 'AUTH_ACCOUNT_LOCKED' }),
    });
  });

  it('does not lock out a different email after another one fails repeatedly', async () => {
    pg.query.mockResolvedValue([]);
    for (let i = 0; i < 5; i += 1) {
      await expect(
        service.userLogin({ email: 'victim@safaar.uz', password: 'wrong' }),
      ).rejects.toMatchObject({ status: 401 });
    }

    pg.query.mockResolvedValueOnce([
      {
        id: 'u1',
        email: 'other@safaar.uz',
        status: 'active',
        password_hash: 'hash',
      },
    ]);
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    pg.query.mockResolvedValueOnce([]);

    await expect(
      service.userLogin({ email: 'other@safaar.uz', password: 'correct' }),
    ).resolves.toBeDefined();
  });

  it('resets the failed-attempt counter on a successful user login', async () => {
    pg.query.mockResolvedValue([]);
    for (let i = 0; i < 4; i += 1) {
      await expect(
        service.userLogin({ email: 'user@safaar.uz', password: 'wrong' }),
      ).rejects.toMatchObject({ status: 401 });
    }

    pg.query.mockResolvedValueOnce([
      {
        id: 'u1',
        email: 'user@safaar.uz',
        status: 'active',
        password_hash: 'hash',
      },
    ]);
    (argon2.verify as jest.Mock).mockResolvedValueOnce(true);
    pg.query.mockResolvedValueOnce([]);

    await expect(
      service.userLogin({ email: 'user@safaar.uz', password: 'correct' }),
    ).resolves.toBeDefined();

    pg.query.mockResolvedValue([]);
    for (let i = 0; i < 4; i += 1) {
      await expect(
        service.userLogin({ email: 'user@safaar.uz', password: 'wrong' }),
      ).rejects.toMatchObject({
        status: 401,
        response: expect.objectContaining({ code: 'AUTH_INVALID_CREDENTIALS' }),
      });
    }
  });

  it('locks out partner login after 5 failed attempts for the same email', async () => {
    pg.query.mockResolvedValue([]);

    for (let i = 0; i < 5; i += 1) {
      await expect(
        service.partnerLogin({ email: 'partner@safaar.uz', password: 'wrong' }),
      ).rejects.toMatchObject({ status: 401 });
    }

    await expect(
      service.partnerLogin({ email: 'partner@safaar.uz', password: 'wrong' }),
    ).rejects.toMatchObject({
      status: 401,
      response: expect.objectContaining({ code: 'AUTH_ACCOUNT_LOCKED' }),
    });
  });

  it('locks out admin login after 5 failed attempts for the same identifier', async () => {
    pg.query.mockResolvedValue([]);

    for (let i = 0; i < 5; i += 1) {
      await expect(
        service.adminLogin({ username: 'admin', password: 'wrong' }),
      ).rejects.toMatchObject({ status: 401 });
    }

    await expect(
      service.adminLogin({ username: 'admin', password: 'wrong' }),
    ).rejects.toMatchObject({
      status: 401,
      response: expect.objectContaining({ code: 'AUTH_ACCOUNT_LOCKED' }),
    });
  });

  it('keeps user- and partner-login lockout counters independent for the same email', async () => {
    pg.query.mockResolvedValue([]);
    for (let i = 0; i < 5; i += 1) {
      await expect(
        service.userLogin({ email: 'shared@safaar.uz', password: 'wrong' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'AUTH_INVALID_CREDENTIALS' }),
      });
    }

    await expect(
      service.partnerLogin({ email: 'shared@safaar.uz', password: 'wrong' }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'AUTH_INVALID_CREDENTIALS' }),
    });
  });
});

describe('AuthService demo-mode OTP (ENABLE_DEMO_AUTH — SMS/email provider unconfigured in tests)', () => {
  const originalEnv = { ...process.env };
  const pg = { query: jest.fn(), transaction: jest.fn() };
  const jobs = { add: jest.fn() };
  const email = { send: jest.fn() };
  const sms = { send: jest.fn() };
  const cache = { get: jest.fn(), set: jest.fn(), take: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.ENABLE_DEMO_AUTH;
    jobs.add.mockResolvedValue(undefined);
    sms.send.mockRejectedValue(
      new ServiceUnavailableException({
        code: 'SMS_PROVIDER_NOT_CONFIGURED',
        message: 'SMS provayder ulanmagan',
      }),
    );
    service = new AuthService(
      pg as unknown as PostgresService,
      jobs as unknown as JobQueueService,
      email as unknown as EmailService,
      sms as unknown as SmsService,
      cache as unknown as AppCacheService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('sendUserOtp still fails cleanly when demo mode is off (default)', async () => {
    await expect(service.sendUserOtp('+998901234567')).rejects.toMatchObject({
      response: { code: 'SMS_PROVIDER_NOT_CONFIGURED' },
    });
  });

  it('sendUserOtp sends a real SMS when demo mode is off and the provider is configured', async () => {
    sms.send.mockResolvedValueOnce({ accepted: true, providerMessageId: 'sms-1' });

    const result = (await service.sendUserOtp('+998901234567')) as {
      sent: boolean;
      dev_code?: string;
    };

    expect(sms.send).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+998901234567' }),
    );
    expect(result.sent).toBe(true);
    expect(result).not.toHaveProperty('dev_code');
  });

  it('sendUserOtp returns a real, usable dev_code when ENABLE_DEMO_AUTH=true', async () => {
    process.env.ENABLE_DEMO_AUTH = 'true';

    const result = (await service.sendUserOtp('+998901234567')) as {
      sent: boolean;
      challenge_id: string;
      dev_code?: string;
    };

    expect(result.sent).toBe(true);
    expect(result.dev_code).toMatch(/^\d{6}$/);
    expect(sms.send).not.toHaveBeenCalled();

    // dev_code haqiqiy OTP kod bo'lishi kerak — u bilan verify qilish
    // ishlashi kerak (frontend uni ko'rsatib, user shu kod bilan davom
    // etadi).
    pg.query.mockResolvedValueOnce([]); // SELECT user by phone -> not found
    pg.query.mockResolvedValueOnce([]); // INSERT new user
    jest.spyOn(authSessionStore, 'create').mockResolvedValue({} as never);

    await expect(
      service.verifyUserOtp({
        phone: '+998901234567',
        code: result.dev_code!,
        challenge_id: result.challenge_id,
      }),
    ).resolves.toBeDefined();
  });

  it('sendPartnerOtp behaves the same way (fails off, dev_code on)', async () => {
    process.env.ENABLE_DEMO_AUTH = 'true';

    const result = (await service.sendPartnerOtp('+998901234567')) as {
      dev_code?: string;
    };
    expect(result.dev_code).toMatch(/^\d{6}$/);
  });

  it('demo mode works regardless of NODE_ENV — it is gated solely by the explicit ENABLE_DEMO_AUTH flag', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEMO_AUTH = 'true';

    const result = (await service.sendUserOtp('+998901234567')) as {
      dev_code?: string;
    };

    expect(result.dev_code).toMatch(/^\d{6}$/);
  });

  it('sendUserEmailOtp skips real email delivery and returns dev_code in demo mode', async () => {
    process.env.ENABLE_DEMO_AUTH = 'true';

    const result = await service.sendUserEmailOtp('demo-user@safaar.uz');

    expect(email.send).not.toHaveBeenCalled();
    expect((result as { dev_code?: string }).dev_code).toMatch(/^\d{6}$/);
  });

  it('sendPartnerEmailOtp skips real email delivery and returns dev_code in demo mode', async () => {
    process.env.ENABLE_DEMO_AUTH = 'true';
    pg.query.mockResolvedValueOnce([
      {
        id: '00000000-0000-4000-8000-000000000010',
        organization_status: 'approved',
      },
    ]);

    const result = await service.sendPartnerEmailOtp('demo-partner@safaar.uz');

    expect(email.send).not.toHaveBeenCalled();
    expect(jobs.add).not.toHaveBeenCalled();
    expect((result as { dev_code?: string }).dev_code).toMatch(/^\d{6}$/);
  });

  it('sendUserEmailOtp still requires real delivery when demo mode is off (existing behavior preserved)', async () => {
    email.send.mockResolvedValueOnce({ accepted: true });

    const result = await service.sendUserEmailOtp('real-user@safaar.uz');

    expect(email.send).toHaveBeenCalledTimes(1);
    expect(result).not.toHaveProperty('dev_code');
  });
});
