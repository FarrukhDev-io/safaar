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
import type { AppCacheService } from '../infrastructure/cache.service';
import type { EmailMessage } from '../integrations/email/email-provider.interface';
import { authSessionStore } from './session-store';

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
    jobs.add.mockResolvedValue(undefined);
    cache.set.mockResolvedValue(undefined);
    service = new AuthService(
      pg as unknown as PostgresService,
      jobs as unknown as JobQueueService,
      email as unknown as EmailService,
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
