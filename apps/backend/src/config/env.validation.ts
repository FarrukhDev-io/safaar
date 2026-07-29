interface EnvironmentConfig {
  NODE_ENV: string;
  APP_NAME: string;
  WEB_USER_URL: string;
  PORT: number;
  API_PREFIX: string;
  BUSINESS_TIMEZONE: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  JWT_ACCESS_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  JWT_ACCESS_TTL: string;
  JWT_REFRESH_TTL: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  TOTP_ENCRYPTION_KEY?: string;
  OTP_PEPPER?: string;
  PARTNER_API_KEY_PEPPER?: string;
  PAYMENT_WEBHOOK_SECRET?: string;
  DB_CONNECTION_TIMEOUT_MS: number;
  DB_QUERY_TIMEOUT_MS: number;
  DB_QUERY_ATTEMPTS: number;
  DB_POOL_MAX: number;
  DB_IDLE_TIMEOUT_MS: number;
  SLOW_REQUEST_MS: number;
  SLOW_QUERY_MS: number;
  CACHE_ENABLED: string;
  CACHE_DEFAULT_TTL_SECONDS: number;
  CORS_ORIGINS?: string;
  SWAGGER_ENABLED: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_CALLBACK_URL?: string;
  FACEBOOK_APP_ID?: string;
  FACEBOOK_APP_SECRET?: string;
  FACEBOOK_CALLBACK_URL?: string;
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentConfig {
  const nodeEnv = String(config.NODE_ENV ?? 'development');
  const production = nodeEnv === 'production';

  if (production) {
    for (const key of [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'TOTP_ENCRYPTION_KEY',
      'OTP_PEPPER',
      'PARTNER_API_KEY_PEPPER',
      'PAYMENT_WEBHOOK_SECRET',
      'CORS_ORIGINS',
    ]) {
      if (!config[key]) {
        throw new Error(`${key} production muhitida majburiy`);
      }
    }

    for (const key of [
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'TOTP_ENCRYPTION_KEY',
      'OTP_PEPPER',
      'PARTNER_API_KEY_PEPPER',
      'PAYMENT_WEBHOOK_SECRET',
    ]) {
      const value = String(config[key] ?? '');
      if (value.length < 32 || value.toLowerCase().includes('change_me')) {
        throw new Error(`${key} production uchun kuchli qiymat bo'lishi kerak`);
      }
    }

    if (String(config.CORS_ORIGINS).includes('*')) {
      throw new Error(
        'CORS_ORIGINS production muhitida * bo‘lishi mumkin emas',
      );
    }
  }

  return {
    NODE_ENV: nodeEnv,
    APP_NAME: String(config.APP_NAME ?? 'uzbron-api'),
    WEB_USER_URL: String(config.WEB_USER_URL ?? 'http://localhost:3000'),
    PORT: toNumber(config.PORT, 4000),
    API_PREFIX: String(config.API_PREFIX ?? 'v1'),
    BUSINESS_TIMEZONE: String(config.BUSINESS_TIMEZONE ?? 'Asia/Tashkent'),
    DATABASE_URL: config.DATABASE_URL ? String(config.DATABASE_URL) : undefined,
    REDIS_URL: config.REDIS_URL ? String(config.REDIS_URL) : undefined,
    JWT_ACCESS_SECRET: config.JWT_ACCESS_SECRET
      ? String(config.JWT_ACCESS_SECRET)
      : undefined,
    JWT_REFRESH_SECRET: config.JWT_REFRESH_SECRET
      ? String(config.JWT_REFRESH_SECRET)
      : undefined,
    JWT_ACCESS_TTL: String(
      config.JWT_ACCESS_TTL ?? config.JWT_ACCESS_EXPIRES_IN ?? '15m',
    ),
    JWT_REFRESH_TTL: String(
      config.JWT_REFRESH_TTL ?? config.JWT_REFRESH_EXPIRES_IN ?? '30d',
    ),
    JWT_ISSUER: String(config.JWT_ISSUER ?? 'uzbron-api'),
    JWT_AUDIENCE: String(config.JWT_AUDIENCE ?? 'uzbron-clients'),
    TOTP_ENCRYPTION_KEY: config.TOTP_ENCRYPTION_KEY
      ? String(config.TOTP_ENCRYPTION_KEY)
      : undefined,
    OTP_PEPPER: config.OTP_PEPPER ? String(config.OTP_PEPPER) : undefined,
    PARTNER_API_KEY_PEPPER: config.PARTNER_API_KEY_PEPPER
      ? String(config.PARTNER_API_KEY_PEPPER)
      : undefined,
    PAYMENT_WEBHOOK_SECRET: config.PAYMENT_WEBHOOK_SECRET
      ? String(config.PAYMENT_WEBHOOK_SECRET)
      : undefined,
    DB_CONNECTION_TIMEOUT_MS: toNumber(
      config.DB_CONNECTION_TIMEOUT_MS,
      production ? 8000 : 5000,
    ),
    DB_QUERY_TIMEOUT_MS: toNumber(
      config.DB_QUERY_TIMEOUT_MS,
      production ? 8000 : 5000,
    ),
    DB_QUERY_ATTEMPTS: toNumber(config.DB_QUERY_ATTEMPTS, production ? 3 : 1),
    DB_POOL_MAX: toNumber(config.DB_POOL_MAX, 5),
    DB_IDLE_TIMEOUT_MS: toNumber(config.DB_IDLE_TIMEOUT_MS, 10000),
    SLOW_REQUEST_MS: toNumber(config.SLOW_REQUEST_MS, 1000),
    SLOW_QUERY_MS: toNumber(config.SLOW_QUERY_MS, 300),
    CACHE_ENABLED: String(config.CACHE_ENABLED ?? 'true'),
    CACHE_DEFAULT_TTL_SECONDS: toNumber(config.CACHE_DEFAULT_TTL_SECONDS, 300),
    CORS_ORIGINS: config.CORS_ORIGINS ? String(config.CORS_ORIGINS) : undefined,
    SWAGGER_ENABLED: String(config.SWAGGER_ENABLED ?? !production),
    SMTP_HOST: config.SMTP_HOST ? String(config.SMTP_HOST) : undefined,
    SMTP_PORT: config.SMTP_PORT ? toNumber(config.SMTP_PORT, 587) : undefined,
    SMTP_USER: config.SMTP_USER ? String(config.SMTP_USER) : undefined,
    SMTP_PASS: config.SMTP_PASS ? String(config.SMTP_PASS) : undefined,
    SMTP_FROM: config.SMTP_FROM ? String(config.SMTP_FROM) : undefined,
    GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID
      ? String(config.GOOGLE_CLIENT_ID)
      : undefined,
    GOOGLE_CLIENT_SECRET: config.GOOGLE_CLIENT_SECRET
      ? String(config.GOOGLE_CLIENT_SECRET)
      : undefined,
    GOOGLE_CALLBACK_URL: config.GOOGLE_CALLBACK_URL
      ? String(config.GOOGLE_CALLBACK_URL)
      : undefined,
    FACEBOOK_APP_ID: config.FACEBOOK_APP_ID
      ? String(config.FACEBOOK_APP_ID)
      : undefined,
    FACEBOOK_APP_SECRET: config.FACEBOOK_APP_SECRET
      ? String(config.FACEBOOK_APP_SECRET)
      : undefined,
    FACEBOOK_CALLBACK_URL: config.FACEBOOK_CALLBACK_URL
      ? String(config.FACEBOOK_CALLBACK_URL)
      : undefined,
  };
}
