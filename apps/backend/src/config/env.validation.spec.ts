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
});
