import { validateEnv } from './env.validation';

describe('validateEnv (regression: H-3 HOST var was silently dropped)', () => {
  const minimalProdConfig = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://x',
    REDIS_URL: 'redis://x',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'a'.repeat(32),
    TOTP_ENCRYPTION_KEY: 'a'.repeat(32),
    OTP_PEPPER: 'a'.repeat(32),
    PARTNER_API_KEY_PEPPER: 'a'.repeat(32),
    PAYMENT_WEBHOOK_SECRET: 'a'.repeat(32),
    RECOVERY_CODE_PEPPER: 'a'.repeat(32),
    PARTNER_WEBHOOK_SIGNING_SECRET: 'a'.repeat(32),
    CORS_ORIGINS: 'https://safaar.uz',
  };

  it('passes through an explicitly-set HOST value (was previously dropped, defaulting to 0.0.0.0 always)', () => {
    const result = validateEnv({ ...minimalProdConfig, HOST: '127.0.0.1' });
    expect(result.HOST).toBe('127.0.0.1');
  });

  it('defaults HOST to 0.0.0.0 when unset (preserves existing docker-compose behavior)', () => {
    const result = validateEnv(minimalProdConfig);
    expect(result.HOST).toBe('0.0.0.0');
  });

  it('passes through an explicitly-set ENABLE_DEMO_AUTH value (regression: dev_code silently never worked because this var was dropped) — checked outside production, since production now rejects true outright (see the dedicated secret-strength describe block below)', () => {
    const result = validateEnv({
      NODE_ENV: 'development',
      ENABLE_DEMO_AUTH: 'true',
    });
    expect(result.ENABLE_DEMO_AUTH).toBe('true');
  });

  it('defaults ENABLE_DEMO_AUTH to false when unset', () => {
    const result = validateEnv(minimalProdConfig);
    expect(result.ENABLE_DEMO_AUTH).toBe('false');
  });
});

describe('validateEnv — production secret strength (regression: CRITICAL finding, JWT fallback bypassed its own "change_me" check)', () => {
  const minimalProdConfig = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://x',
    REDIS_URL: 'redis://x',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'a'.repeat(32),
    TOTP_ENCRYPTION_KEY: 'a'.repeat(32),
    OTP_PEPPER: 'a'.repeat(32),
    PARTNER_API_KEY_PEPPER: 'a'.repeat(32),
    PAYMENT_WEBHOOK_SECRET: 'a'.repeat(32),
    RECOVERY_CODE_PEPPER: 'a'.repeat(32),
    PARTNER_WEBHOOK_SIGNING_SECRET: 'a'.repeat(32),
    CORS_ORIGINS: 'https://safaar.uz',
  };

  it('passes with a full, strong production config', () => {
    expect(() => validateEnv(minimalProdConfig)).not.toThrow();
  });

  it('rejects a missing JWT_ACCESS_SECRET in production', () => {
    const configWithoutAccessSecret: Record<string, unknown> = {
      ...minimalProdConfig,
    };
    delete configWithoutAccessSecret.JWT_ACCESS_SECRET;
    expect(() => validateEnv(configWithoutAccessSecret)).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('rejects the exact hardcoded fallback string that used to bypass the check ("change-me" with a hyphen, not "change_me")', () => {
    // This is the literal previous fallback value from auth/security.ts.
    // The old check only matched the substring "change_me" (underscore)
    // and let this hyphenated variant through as "strong" — it must be
    // rejected now.
    expect(() =>
      validateEnv({
        ...minimalProdConfig,
        JWT_ACCESS_SECRET: 'development-access-secret-change-me-32',
      }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('rejects other placeholder spellings (changeme, CHANGE_ME, change me)', () => {
    for (const placeholder of [
      'x'.repeat(20) + 'changeme' + 'x'.repeat(10),
      'x'.repeat(20) + 'CHANGE_ME' + 'x'.repeat(10),
      'x'.repeat(20) + 'change me' + 'x'.repeat(10),
    ]) {
      expect(() =>
        validateEnv({ ...minimalProdConfig, JWT_REFRESH_SECRET: placeholder }),
      ).toThrow(/JWT_REFRESH_SECRET/);
    }
  });

  it('rejects a secret shorter than 32 characters even without a placeholder word', () => {
    expect(() =>
      validateEnv({
        ...minimalProdConfig,
        OTP_PEPPER: 'short-but-real-looking',
      }),
    ).toThrow(/OTP_PEPPER/);
  });

  it('rejects production with ENABLE_DEMO_AUTH=true (CRITICAL: leaks real OTP codes in the API response)', () => {
    expect(() =>
      validateEnv({ ...minimalProdConfig, ENABLE_DEMO_AUTH: 'true' }),
    ).toThrow(/ENABLE_DEMO_AUTH/);
  });

  it('rejects production with SWAGGER_ENABLED=true (exposes the full API schema unauthenticated)', () => {
    expect(() =>
      validateEnv({ ...minimalProdConfig, SWAGGER_ENABLED: 'true' }),
    ).toThrow(/SWAGGER_ENABLED/);
  });

  it('allows ENABLE_DEMO_AUTH=true outside production', () => {
    expect(() =>
      validateEnv({ NODE_ENV: 'development', ENABLE_DEMO_AUTH: 'true' }),
    ).not.toThrow();
  });

  it('does not require RECOVERY_CODE_PEPPER / PARTNER_WEBHOOK_SIGNING_SECRET outside production', () => {
    expect(() => validateEnv({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('forwards RECOVERY_CODE_PEPPER and PARTNER_WEBHOOK_SIGNING_SECRET through to the returned config (regression: these were read via raw process.env elsewhere but never included in this return value, so they were silently undefined at runtime)', () => {
    const result = validateEnv(minimalProdConfig);
    expect(result.RECOVERY_CODE_PEPPER).toBe(
      minimalProdConfig.RECOVERY_CODE_PEPPER,
    );
    expect(result.PARTNER_WEBHOOK_SIGNING_SECRET).toBe(
      minimalProdConfig.PARTNER_WEBHOOK_SIGNING_SECRET,
    );
  });
});
