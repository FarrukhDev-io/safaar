import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import {
  Role,
  type ActorType,
  type VerifyOtpDto,
  type AuthTokens,
  type OAuthExchangeResult,
  type OAuthProvider,
  type OAuthProviderAvailability,
} from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { JOBS } from '../jobs/job-names';
import { PostgresService } from '../infrastructure/postgres.service';
import { JobQueueService } from '../infrastructure/job-queue.service';
import { EmailService } from '../infrastructure/email.service';
import { AppCacheService } from '../infrastructure/cache.service';
import { otpStore, type OtpPurpose } from './otp-store';
import { authSessionStore } from './session-store';
import { signJwt, verifyJwt } from './security';
import { createTotpSetup, verifyTotpCode, type TotpSetup } from './totp';

type DbRow = Record<string, unknown>;

interface AdminUserRecord {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  full_name?: string;
  role: Role;
  roles: Role[];
  status: string;
  totp_secret?: string;
  recovery_code_hashes?: string[];
  created_at: string;
  updated_at: string;
}

interface PartnerUserRecord {
  id: string;
  organization_id: string;
  email: string;
  password_hash: string;
  full_name?: string;
  status: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface IssueTokenInput {
  actorId: string;
  actorType: ActorType;
  role: Role;
  roles?: Role[];
  organizationId?: string | null;
}

interface TwoFactorChallenge {
  id: string;
  admin: AdminUserRecord;
  expiresAt: number;
}

interface OAuthStateContext {
  provider: OAuthProvider;
  locale: 'uz' | 'ru' | 'en';
  next: string;
}

interface OAuthExchangeContext {
  userId: string;
}

interface PasswordResetContext {
  email: string;
}

interface OAuthProfile {
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class AuthService {
  private readonly twoFactorChallenges = new Map<string, TwoFactorChallenge>();
  private readonly pendingTotpSetups = new Map<
    string,
    { adminId: string; setup: TotpSetup; expiresAt: number }
  >();

  constructor(
    private readonly pg: PostgresService,
    private readonly jobs: JobQueueService,
    private readonly emailService: EmailService,
    private readonly cache: AppCacheService,
  ) {}

  sendUserOtp(phone: string) {
    void phone;
    throw new ServiceUnavailableException({
      code: 'SMS_PROVIDER_NOT_CONFIGURED',
      message: 'SMS provayder ulanmagan',
    });
  }

  async sendUserEmailOtp(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!this.isValidEmail(normalizedEmail)) {
      throw new BadRequestException({
        code: 'EMAIL_INVALID',
        message: "To'g'ri email manzil kiriting",
      });
    }

    const response = this.createOtpChallenge(normalizedEmail, 'user_login');
    const code = otpStore.getDeliveryCode(response.challenge_id);
    const message = {
      to: normalizedEmail,
      subject: 'Safaar kirish kodi',
      text: `Safaar hisobingizga kirish kodingiz: ${code ?? '******'}`,
      html: `<p>Safaar hisobingizga kirish kodingiz:</p><h2>${code ?? '******'}</h2>`,
    };

    const delivery = await this.emailService.send(message);
    if (!delivery.accepted) {
      throw new ServiceUnavailableException({
        code: 'EMAIL_DELIVERY_FAILED',
        message: 'Tasdiqlash kodini emailga yuborib bo\u2018lmadi',
      });
    }

    return {
      sent: response.sent,
      challenge_id: response.challenge_id,
      expires_in_seconds: response.expires_in_seconds,
      resend_after_seconds: response.resend_after_seconds,
    };
  }

  sendPartnerOtp(phone: string) {
    void phone;
    throw new ServiceUnavailableException({
      code: 'SMS_PROVIDER_NOT_CONFIGURED',
      message: 'SMS provayder ulanmagan',
    });
  }

  async sendPartnerEmailOtp(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!this.isValidEmail(normalizedEmail)) {
      throw this.invalidCredentials();
    }

    await this.assertApprovedPartnerEmail(normalizedEmail);
    const response = this.createOtpChallenge(normalizedEmail, 'partner_login');
    const code = otpStore.getDeliveryCode(response.challenge_id);

    const message = {
      to: normalizedEmail,
      subject: 'Safaar hamkor kabineti uchun kirish kodi',
      text: `Safaar hamkor kabinetiga kirish kodingiz: ${code ?? '******'}`,
      html: `<p>Safaar hamkor kabinetiga kirish kodingiz:</p><h2>${code ?? '******'}</h2>`,
    };

    const delivery = await this.emailService.send(message);
    if (!delivery.accepted) {
      throw new ServiceUnavailableException({
        code: 'EMAIL_DELIVERY_FAILED',
        message: 'Tasdiqlash kodini emailga yuborib bo‘lmadi',
      });
    }

    await this.jobs.add(JOBS.SEND_EMAIL, message, {
      idempotencyKey: `partner-login-email:${response.challenge_id}`,
    });

    return {
      sent: response.sent,
      challenge_id: response.challenge_id,
      expires_in_seconds: response.expires_in_seconds,
      resend_after_seconds: response.resend_after_seconds,
    };
  }

  async verifyUserOtp(
    dto: VerifyOtpDto,
  ): Promise<AuthTokens & { user: unknown }> {
    const phone = this.normalizePhone(dto.phone);
    this.consumeOtp({
      challengeId: dto.challenge_id,
      phone,
      purpose: 'user_login',
      code: dto.code,
    });

    const rows = await this.pg.query<DbRow>(
      `SELECT id::text, phone, status, preferred_language, bonus_balance,
              first_name, last_name, email, phone_verified_at, last_login_at,
              created_at, updated_at
       FROM users
       WHERE phone = $1
       LIMIT 1`,
      [phone],
    );

    let user: DbRow;
    if (rows.length === 0) {
      const id = randomUUID();
      const now = new Date().toISOString();
      await this.pg.query(
        `INSERT INTO users (id, phone, status, preferred_language, bonus_balance, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, phone, 'active', 'uz', 0, now, now],
      );
      user = {
        id,
        phone,
        status: 'active',
        preferred_language: 'uz',
        bonus_balance: 0,
        first_name: null,
        last_name: null,
        email: null,
        phone_verified_at: null,
        last_login_at: null,
        created_at: now,
        updated_at: now,
      };
    } else {
      user = rows[0];
    }

    return {
      ...(await this.issueTokens({
        actorId: String(user['id']),
        actorType: 'user',
        role: Role.USER,
      })),
      user,
    };
  }

  async verifyUserEmailOtp(dto: {
    email: string;
    code: string;
    challenge_id?: string;
  }): Promise<OAuthExchangeResult> {
    const email = this.normalizeEmail(dto.email);
    if (!this.isValidEmail(email)) {
      throw new BadRequestException({
        code: 'EMAIL_INVALID',
        message: "To'g'ri email manzil kiriting",
      });
    }

    this.consumeOtp({
      challengeId: dto.challenge_id,
      phone: email,
      purpose: 'user_login',
      code: dto.code,
    });

    const now = new Date().toISOString();
    const id = randomUUID();
    const rows = await this.pg.query<DbRow>(
      `INSERT INTO users
         (id, phone, email, status, preferred_language, bonus_balance,
          email_verified_at, last_login_at, created_at, updated_at)
       VALUES ($1::uuid, null, $2, 'active', 'uz', 0, $3, $3, $3, $3)
       ON CONFLICT (email) DO UPDATE
       SET email_verified_at = EXCLUDED.email_verified_at,
           last_login_at = EXCLUDED.last_login_at,
           status = CASE
             WHEN users.status = 'unverified' THEN 'active'::"UserStatus"
             ELSE users.status
           END,
           updated_at = EXCLUDED.updated_at
       RETURNING id::text, email, first_name, last_name, status::text`,
      [id, email, now],
    );
    if (rows[0]?.['status'] !== 'active') {
      throw new UnauthorizedException({
        code: 'USER_NOT_ACTIVE',
        message: 'Foydalanuvchi hisobi faol emas',
      });
    }
    const user = this.oauthUser(rows[0]);

    return {
      ...(await this.issueTokens({
        actorId: user.id,
        actorType: 'user',
        role: Role.USER,
      })),
      user,
    };
  }

  async verifyPartnerOtp(dto: VerifyOtpDto): Promise<AuthTokens> {
    const phone = this.normalizePhone(dto.phone);
    this.consumeOtp({
      challengeId: dto.challenge_id,
      phone,
      purpose: 'partner_login',
      code: dto.code,
    });

    return this.issuePartnerTokensByPhone(phone);
  }

  async verifyPartnerEmailOtp(body: Record<string, unknown>): Promise<
    AuthTokens & {
      organization_id: string;
      organizationId: string;
      partner_role: string;
    }
  > {
    const email = this.normalizeEmail(body.email);
    const code = String(body.code ?? '');
    const challengeId = String(
      body.challenge_id ?? body.chalenge_id ?? '',
    ).trim();

    if (!this.isValidEmail(email)) {
      throw this.invalidCredentials();
    }

    this.consumeOtp({
      challengeId,
      phone: email,
      purpose: 'partner_login',
      code,
    });

    return this.issuePartnerTokensByEmail(email);
  }

  async completeProfile(
    actor: RequestActor | undefined,
    body: Record<string, unknown>,
  ) {
    const currentActor = this.requireActor(actor, 'user');

    const rows = await this.pg.query<DbRow>(
      `SELECT id::text, phone, status, preferred_language, bonus_balance,
              first_name, last_name, email, password_hash, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [currentActor.id],
    );

    if (rows.length === 0) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'User topilmadi',
      });
    }

    const firstName = String(
      body.first_name ?? body.firstName ?? rows[0]['first_name'] ?? '',
    );
    const lastName = String(
      body.last_name ?? body.lastName ?? rows[0]['last_name'] ?? '',
    );
    const phoneInput = body.phone ?? body.phone_number ?? body.phoneNumber;
    const phoneDigits = String(phoneInput ?? '').replace(/\D/g, '');
    const phone = phoneDigits
      ? this.normalizePhone(String(phoneInput))
      : rows[0]['phone'];
    const email = body.email
      ? String(body.email).toLowerCase()
      : rows[0]['email'];
    const preferredLanguage = ['uz', 'ru', 'en'].includes(
      String(body.preferred_language),
    )
      ? String(body.preferred_language)
      : rows[0]['preferred_language'];
    const passwordHash = body.password
      ? await argon2.hash(String(body.password))
      : rows[0]['password_hash'];
    const now = new Date().toISOString();

    if (
      phoneDigits &&
      !(
        phoneDigits.length === 9 ||
        (phoneDigits.startsWith('998') && phoneDigits.length === 12)
      )
    ) {
      throw new BadRequestException({
        code: 'PHONE_INVALID',
        message: "To'g'ri telefon raqam kiriting",
      });
    }

    if (phone) {
      const existingPhone = await this.pg.query<DbRow>(
        `SELECT id::text
         FROM users
         WHERE phone = $1 AND id <> $2
         LIMIT 1`,
        [phone, currentActor.id],
      );
      if (existingPhone.length > 0) {
        throw new BadRequestException({
          code: 'PHONE_ALREADY_EXISTS',
          message: 'Bu telefon raqami boshqa foydalanuvchiga biriktirilgan',
        });
      }
    }

    await this.pg.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, phone = $3, email = $4,
           preferred_language = $5, password_hash = $6, updated_at = $7
       WHERE id = $8`,
      [
        firstName,
        lastName,
        phone,
        email,
        preferredLanguage,
        passwordHash,
        now,
        currentActor.id,
      ],
    );

    return {
      ...rows[0],
      first_name: firstName,
      last_name: lastName,
      phone,
      email,
      preferred_language: preferredLanguage,
      updated_at: now,
    };
  }

  oauthProviders(): OAuthProviderAvailability {
    return {
      google: this.oauthConfigured('google'),
      facebook: this.oauthConfigured('facebook'),
    };
  }

  async oauthRedirect(
    provider: OAuthProvider,
    input: { locale?: unknown; next?: unknown },
  ) {
    const config = this.oauthConfig(provider);
    const state = randomBytes(32).toString('base64url');
    const context: OAuthStateContext = {
      provider,
      locale: this.oauthLocale(input.locale),
      next: this.safeNext(input.next),
    };
    await this.cache.set(this.oauthStateKey(state), context, 10 * 60);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackUrl,
      response_type: 'code',
      state,
    });
    if (provider === 'google') {
      params.set('scope', 'openid email profile');
      params.set('prompt', 'select_account');
    } else {
      params.set('scope', 'email,public_profile');
    }

    return {
      state,
      redirectUrl:
        provider === 'google'
          ? `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
          : `https://www.facebook.com/v22.0/dialog/oauth?${params.toString()}`,
    };
  }

  async oauthCallback(
    provider: OAuthProvider,
    input: {
      code?: unknown;
      state?: unknown;
      error?: unknown;
    },
    cookieState: string | undefined,
  ): Promise<{ code: string; locale: string; next: string }> {
    const state = String(input.state ?? '');
    const providerError = String(input.error ?? '');
    if (providerError || !state || !cookieState || state !== cookieState) {
      throw new UnauthorizedException({
        code: providerError ? 'OAUTH_CANCELLED' : 'OAUTH_STATE_INVALID',
        message: providerError
          ? 'Ijtimoiy tarmoq orqali kirish bekor qilindi'
          : 'OAuth state yaroqsiz',
      });
    }

    const context = await this.cache.take<OAuthStateContext>(
      this.oauthStateKey(state),
    );
    if (!context || context.provider !== provider) {
      throw new UnauthorizedException({
        code: 'OAUTH_STATE_EXPIRED',
        message: 'OAuth so\u2018rovi muddati tugagan',
      });
    }

    const authorizationCode = String(input.code ?? '');
    if (!authorizationCode) {
      throw new UnauthorizedException({
        code: 'OAUTH_CODE_MISSING',
        message: 'OAuth tasdiqlash kodi topilmadi',
      });
    }

    const profile = await this.fetchOAuthProfile(provider, authorizationCode);

    const userId = await this.upsertOAuthUser(provider, profile);

    const exchangeCode = randomBytes(32).toString('base64url');
    await this.cache.set<OAuthExchangeContext>(
      this.oauthExchangeKey(exchangeCode),
      { userId },
      60,
    );

    return {
      code: exchangeCode,
      locale: context.locale,
      next: context.next,
    };
  }

  async oauthExchange(code: string): Promise<OAuthExchangeResult> {
    const normalizedCode = code.trim();
    const context = normalizedCode
      ? await this.cache.take<OAuthExchangeContext>(
          this.oauthExchangeKey(normalizedCode),
        )
      : undefined;
    if (!context) {
      throw new UnauthorizedException({
        code: 'OAUTH_EXCHANGE_INVALID',
        message: 'OAuth kirish kodi yaroqsiz yoki ishlatilgan',
      });
    }

    const rows = await this.pg.query<DbRow>(
      `SELECT id::text, email, first_name, last_name
       FROM users
       WHERE id = $1::uuid AND deleted_at IS NULL AND status = 'active'
       LIMIT 1`,
      [context.userId],
    );
    const user = this.oauthUser(rows[0]);

    return {
      ...(await this.issueTokens({
        actorId: user.id,
        actorType: 'user',
        role: Role.USER,
      })),
      user,
    };
  }

  oauthToken(provider: OAuthProvider, body: Record<string, unknown>) {
    void body;
    throw new ServiceUnavailableException({
      code: 'OAUTH_PROVIDER_NOT_CONFIGURED',
      message: `${provider} OAuth provider rasmiy token verifikatsiyasi ulanmagan`,
    });
  }

  async socialAccounts(actor: RequestActor | undefined) {
    const currentActor = this.requireActor(actor, 'user');
    return this.pg.query<DbRow>(
      `SELECT id::text, user_id::text, provider, provider_user_id,
              provider_email, email_verified, created_at, updated_at
       FROM user_social_accounts
       WHERE user_id = $1::uuid
       ORDER BY created_at DESC`,
      [currentActor.id],
    );
  }

  async unlinkSocialAccount(actor: RequestActor | undefined, id: string) {
    const currentActor = this.requireActor(actor, 'user');
    const rows = await this.pg.query<DbRow>(
      `DELETE FROM user_social_accounts
       WHERE id = $1::uuid AND user_id = $2::uuid
       RETURNING id::text, provider`,
      [id, currentActor.id],
    );
    return rows[0] ?? { id, deleted: true };
  }

  async partnerLogin(body: Record<string, unknown>) {
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(body.password ?? '');
    const partnerUser = await this.findPartnerUser(email);

    if (
      !partnerUser ||
      partnerUser.status !== 'active' ||
      !(await this.verifyPassword(partnerUser.password_hash, password))
    ) {
      throw this.invalidCredentials();
    }

    const orgRows = await this.pg.query<DbRow>(
      `SELECT id::text, status
       FROM partner_organizations
       WHERE id = $1
       LIMIT 1`,
      [partnerUser.organization_id],
    );
    const organization = orgRows[0];

    const organizationStatus = String(organization?.['status'] ?? '');
    if (!this.isPartnerLoginStatusAllowed(organizationStatus)) {
      throw new UnauthorizedException({
        code: 'PARTNER_NOT_ACTIVE',
        message: 'Hamkor tashkilot faol emas',
      });
    }

    return {
      ...(await this.issueTokens({
        actorId: partnerUser.id,
        actorType: 'partner',
        role: Role.PARTNER,
        organizationId: partnerUser.organization_id,
      })),
      organization_id: partnerUser.organization_id,
      organizationId: partnerUser.organization_id,
      organization_status: organizationStatus,
      organizationStatus,
      partner_role: partnerUser.role,
    };
  }

  async userLogin(body: Record<string, unknown>) {
    const email = this.normalizeEmail(body.email);
    const password = String(body.password ?? '');

    if (!this.isValidEmail(email) || !password) {
      throw this.invalidCredentials();
    }

    const rows = await this.pg.query<DbRow>(
      `SELECT id::text, email, first_name, last_name, status::text, password_hash
       FROM users
       WHERE lower(email) = lower($1) AND deleted_at IS NULL
       LIMIT 1`,
      [email],
    );
    const user = rows[0];

    if (!user || user['status'] !== 'active') {
      throw this.invalidCredentials();
    }

    if (!user['password_hash']) {
      throw new UnauthorizedException({
        code: 'USER_NO_PASSWORD',
        message: "Parol o'rnatilmagan. Ro'yxatdan o'ting.",
      });
    }

    if (!(await this.verifyPassword(String(user['password_hash']), password))) {
      throw this.invalidCredentials();
    }

    await this.pg.query(
      `UPDATE users SET last_login_at = $2, updated_at = $2
       WHERE id = $1::uuid`,
      [user['id'], new Date().toISOString()],
    );

    return {
      ...(await this.issueTokens({
        actorId: String(user['id']),
        actorType: 'user',
        role: Role.USER,
      })),
      user: {
        id: String(user['id']),
        email: this.normalizeEmail(user['email']),
        firstName: this.optionalText(user['first_name']) ?? null,
        lastName: this.optionalText(user['last_name']) ?? null,
      },
    };
  }

  async userForgotPassword(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!this.isValidEmail(normalizedEmail)) {
      throw new BadRequestException({
        code: 'EMAIL_INVALID',
        message: "To'g'ri email manzil kiriting",
      });
    }

    const rows = await this.pg.query<DbRow>(
      `SELECT id::text FROM users
       WHERE lower(email) = lower($1) AND deleted_at IS NULL AND status = 'active'
       LIMIT 1`,
      [normalizedEmail],
    );
    if (!rows[0]) {
      return { sent: true };
    }

    const response = this.createOtpChallenge(normalizedEmail, 'password_reset');

    const code = otpStore.getDeliveryCode(response.challenge_id);
    const message = {
      to: normalizedEmail,
      subject: 'Safaar parolni tiklash kodi',
      text: `Safaar parolni tiklash kodingiz: ${code ?? '******'}`,
      html: `<p>Safaar parolni tiklash kodingiz:</p><h2>${code ?? '******'}</h2>`,
    };

    try {
      await this.emailService.send(message);
    } catch {
      // Email yuborilmasa ham xatolik bermaymiz (security)
    }

    return {
      sent: true,
      challenge_id: response.challenge_id,
      expires_in_seconds: response.expires_in_seconds,
      resend_after_seconds: response.resend_after_seconds,
    };
  }

  async userResetPassword(body: {
    email: string;
    code?: string;
    challenge_id?: string;
    reset_token?: string;
    password: string;
  }) {
    const email = body.reset_token
      ? await this.consumePasswordResetToken(body.reset_token)
      : this.normalizeEmail(body.email);
    if (!this.isValidEmail(email)) {
      throw new BadRequestException({
        code: 'EMAIL_INVALID',
        message: "To'g'ri email manzil kiriting",
      });
    }

    if (!body.reset_token) {
      this.consumeOtp({
        challengeId: body.challenge_id,
        phone: email,
        purpose: 'password_reset',
        code: String(body.code ?? ''),
      });
    }

    const hash = await argon2.hash(String(body.password));
    const now = new Date().toISOString();

    await this.pg.query(
      `UPDATE users
       SET password_hash = $2, updated_at = $3
       WHERE lower(email) = lower($1) AND deleted_at IS NULL`,
      [email, hash, now],
    );

    return { reset: true };
  }

  async userVerifyPasswordResetCode(body: {
    email: string;
    code: string;
    challenge_id?: string;
  }) {
    const email = this.normalizeEmail(body.email);
    if (!this.isValidEmail(email)) {
      throw new BadRequestException({
        code: 'EMAIL_INVALID',
        message: "To'g'ri email manzil kiriting",
      });
    }

    this.consumeOtp({
      challengeId: body.challenge_id,
      phone: email,
      purpose: 'password_reset',
      code: body.code,
    });

    const resetToken = randomBytes(32).toString('base64url');
    await this.cache.set<PasswordResetContext>(
      this.passwordResetKey(resetToken),
      { email },
      10 * 60,
    );

    return {
      verified: true,
      reset_token: resetToken,
      expires_in_seconds: 10 * 60,
    };
  }

  async partnerPhoneLogin(body: Record<string, unknown>) {
    const phone = this.normalizePhone(String(body.phone ?? ''));
    const code = String(body.code ?? '').trim();
    const challengeId = String(
      body.challenge_id ?? body.chalenge_id ?? '',
    ).trim();

    if (!phone || !/^\d{6}$/.test(code)) {
      throw this.invalidCredentials();
    }

    this.consumeOtp({
      challengeId,
      phone,
      purpose: 'partner_login',
      code,
    });

    return this.issuePartnerTokensByPhone(phone);
  }

  async partnerEmailLogin(body: Record<string, unknown>) {
    const email = this.normalizeEmail(body.email);
    if (!this.isValidEmail(email)) {
      throw this.invalidCredentials();
    }

    return this.sendPartnerEmailOtp(email);
  }

  async adminLogin(body: Record<string, unknown>) {
    const login = String(body.username ?? body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(body.password ?? '');
    const admin = await this.findAdminUser(login);

    if (
      !admin ||
      admin.status !== 'active' ||
      !(await this.verifyPassword(admin.password_hash, password))
    ) {
      throw this.invalidCredentials();
    }

    if (!admin.totp_secret) {
      return {
        ...(await this.issueTokens({
          actorId: admin.id,
          actorType: 'admin',
          role: admin.role,
          roles: admin.roles,
        })),
        admin: this.publicAdmin(admin),
      };
    }

    const challengeId = randomUUID();
    this.twoFactorChallenges.set(challengeId, {
      id: challengeId,
      admin,
      expiresAt: Date.now() + 5 * 60_000,
    });

    return {
      challenge_id: challengeId,
      requires_2fa: true,
      expires_in_seconds: 300,
    };
  }

  async adminVerify2fa(body: Record<string, unknown>) {
    const challengeId = String(body.challenge_id ?? body.chalenge_id ?? '');
    const code = String(body.code ?? '');
    const challenge = this.twoFactorChallenges.get(challengeId);

    if (!challenge || challenge.expiresAt <= Date.now()) {
      throw new UnauthorizedException({
        code: 'AUTH_2FA_EXPIRED',
        message: '2FA challenge muddati tugagan',
      });
    }

    if (
      !challenge.admin.totp_secret ||
      !verifyTotpCode(challenge.admin.totp_secret, code)
    ) {
      throw new UnauthorizedException({
        code: 'AUTH_2FA_INVALID',
        message: '2FA kod noto\u2018g\u2018ri',
      });
    }

    this.twoFactorChallenges.delete(challengeId);
    return {
      ...(await this.issueTokens({
        actorId: challenge.admin.id,
        actorType: 'admin',
        role: challenge.admin.role,
        roles: challenge.admin.roles,
      })),
      admin: this.publicAdmin(challenge.admin),
    };
  }

  async admin2faSetup(actor: RequestActor | undefined) {
    const currentActor = this.requireActor(actor, 'admin');

    const rows = await this.pg.query<DbRow>(
      `SELECT id::text, email, password_hash, full_name, role, status,
              totp_secret, recovery_code_hashes, created_at, updated_at
       FROM admin_users
       WHERE id = $1
       LIMIT 1`,
      [currentActor.id],
    );

    if (rows.length === 0) {
      throw this.invalidCredentials();
    }

    const admin = rows[0];
    const email = String(admin['email']);
    const setup = createTotpSetup(email);
    const setupId = randomUUID();
    this.pendingTotpSetups.set(setupId, {
      adminId: currentActor.id,
      setup,
      expiresAt: Date.now() + 10 * 60_000,
    });

    return {
      setup_id: setupId,
      otpauth_url: setup.otpauthUrl,
      secret: setup.secret,
      recovery_codes: setup.recoveryCodes,
      expires_in_seconds: 600,
    };
  }

  async admin2faConfirm(
    actor: RequestActor | undefined,
    body: Record<string, unknown>,
  ) {
    const currentActor = this.requireActor(actor, 'admin');
    const setupId = String(body.setup_id ?? '');
    const code = String(body.code ?? '');
    const pending = this.pendingTotpSetups.get(setupId);

    if (
      !pending ||
      pending.adminId !== currentActor.id ||
      pending.expiresAt <= Date.now()
    ) {
      throw new UnauthorizedException({
        code: 'AUTH_2FA_EXPIRED',
        message: '2FA setup muddati tugagan',
      });
    }

    if (!verifyTotpCode(pending.setup.encryptedSecret, code)) {
      throw new UnauthorizedException({
        code: 'AUTH_2FA_INVALID',
        message: '2FA kod noto\u2018g\u2018ri',
      });
    }

    const rows = await this.pg.query<DbRow>(
      `SELECT id::text
       FROM admin_users
       WHERE id = $1
       LIMIT 1`,
      [currentActor.id],
    );

    if (rows.length === 0) {
      throw this.invalidCredentials();
    }

    const now = new Date().toISOString();
    await this.pg.query(
      `UPDATE admin_users
       SET totp_secret = $1, recovery_code_hashes = $2, updated_at = $3
       WHERE id = $4`,
      [
        pending.setup.encryptedSecret,
        pending.setup.recoveryCodeHashes,
        now,
        currentActor.id,
      ],
    );

    this.pendingTotpSetups.delete(setupId);
    return { enabled: true };
  }

  async admin2faDisable(actor: RequestActor | undefined) {
    const currentActor = this.requireActor(actor, 'admin');

    const rows = await this.pg.query<DbRow>(
      `SELECT id::text
       FROM admin_users
       WHERE id = $1
       LIMIT 1`,
      [currentActor.id],
    );

    if (rows.length === 0) {
      throw this.invalidCredentials();
    }

    const now = new Date().toISOString();
    await this.pg.query(
      `UPDATE admin_users
       SET totp_secret = NULL, recovery_code_hashes = '{}', updated_at = $1
       WHERE id = $2`,
      [now, currentActor.id],
    );

    await authSessionStore.revokeActor(currentActor.id);
    return { disabled: true, sessions_revoked: true };
  }

  passwordResetRequest(actorType: 'partner', body: Record<string, unknown>) {
    return {
      actor_type: actorType,
      email: String(body.email ?? '').toLowerCase(),
      reset_sent: true,
      expires_in_seconds: 1800,
    };
  }

  passwordResetConfirm(actorType: 'partner', body: Record<string, unknown>) {
    return {
      actor_type: actorType,
      reset: Boolean(body.token && body.password),
    };
  }

  async refresh(body: Record<string, unknown>) {
    const refreshToken = String(body.refreshToken ?? body.refresh_token ?? '');
    const payload = verifyJwt(refreshToken, 'refresh');

    if (!payload) {
      throw new UnauthorizedException({
        code: 'AUTH_REFRESH_INVALID',
        message: 'Refresh token yaroqsiz',
      });
    }

    const nextRefreshJti = randomUUID();
    const nextTokens = this.signTokenPair(
      {
        actorId: payload.sub,
        actorType: payload.actor_type,
        role: payload.role,
        roles: payload.roles,
        organizationId: payload.organization_id,
      },
      payload.session_id,
      payload.family_id ?? randomUUID(),
      nextRefreshJti,
    );

    try {
      await authSessionStore.rotate(
        payload.session_id,
        refreshToken,
        payload.jti,
        nextTokens.refreshToken,
        nextRefreshJti,
      );
    } catch (error) {
      const code =
        error instanceof Error && error.message === 'AUTH_REFRESH_REUSED'
          ? 'AUTH_REFRESH_REUSED'
          : 'AUTH_SESSION_REVOKED';
      throw new UnauthorizedException({
        code,
        message: 'Sessiya topilmadi yoki bekor qilingan',
      });
    }

    return nextTokens;
  }

  async logout(actor: RequestActor | undefined) {
    const currentActor = this.requireActor(actor);
    if (currentActor.sessionId) {
      await authSessionStore.revokeSession(currentActor.sessionId);
    }
    return { actor_id: currentActor.id, logged_out: true };
  }

  async logoutAll(actor: RequestActor | undefined) {
    const currentActor = this.requireActor(actor);
    const revoked = await authSessionStore.revokeActor(currentActor.id);
    return { actor_id: currentActor.id, revoked_sessions: revoked };
  }

  async sessions(actor: RequestActor | undefined) {
    const currentActor = this.requireActor(actor);
    const sessionList = await authSessionStore.listForActor(currentActor.id);
    return sessionList.map((session) => ({
      id: session.id,
      actor_id: session.actorId,
      role: session.role,
      user_agent: session.userAgent,
      ip_address: session.ipAddress,
      created_at: session.createdAt,
      expires_at: new Date(session.refreshExpiresAt).toISOString(),
      revoked_at: session.revokedAt,
      current: session.id === currentActor.sessionId,
    }));
  }

  async revokeSession(actor: RequestActor | undefined, id: string) {
    const currentActor = this.requireActor(actor);
    const session = await authSessionStore.get(id);

    if (!session || session.actorId !== currentActor.id) {
      throw new UnauthorizedException({
        code: 'AUTH_SESSION_REVOKED',
        message: 'Sessiya topilmadi',
      });
    }

    await authSessionStore.revokeSession(id);
    return { id, actor_id: currentActor.id, revoked: true };
  }

  private createOtpChallenge(identifier: string, purpose: OtpPurpose) {
    try {
      const challenge = otpStore.create(identifier, purpose);
      const response: {
        sent: boolean;
        challenge_id: string;
        expires_in_seconds: number;
        resend_after_seconds: number;
      } = {
        sent: true,
        challenge_id: challenge.id,
        expires_in_seconds: 300,
        resend_after_seconds: 60,
      };

      return response;
    } catch (error) {
      if (error instanceof Error && error.message === 'OTP_RATE_LIMITED') {
        throw new BadRequestException({
          code: 'OTP_RATE_LIMITED',
          message: 'OTP so\u2018rovlar limiti oshdi',
        });
      }
      throw error;
    }
  }

  private requireActor(
    actor: RequestActor | undefined,
    actorType?: RequestActor['actorType'],
  ): RequestActor {
    if (!actor || (actorType && actor.actorType !== actorType)) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Sessiya topilmadi yoki token yaroqsiz',
      });
    }
    return actor;
  }

  private consumeOtp(input: {
    challengeId?: string;
    phone: string;
    purpose: OtpPurpose;
    code: string;
  }): void {
    try {
      otpStore.consume(input);
    } catch (error) {
      const code =
        error instanceof Error && error.message === 'OTP_EXPIRED'
          ? 'OTP_EXPIRED'
          : 'OTP_INVALID';
      throw new UnauthorizedException({
        code,
        message:
          code === 'OTP_EXPIRED'
            ? 'OTP muddati tugagan'
            : 'OTP noto\u2018g\u2018ri',
      });
    }
  }

  private async issueTokens(input: IssueTokenInput): Promise<AuthTokens> {
    const sessionId = randomUUID();
    const familyId = randomUUID();
    const refreshJti = randomUUID();
    const tokens = this.signTokenPair(input, sessionId, familyId, refreshJti);

    await authSessionStore.create({
      sessionId,
      familyId,
      actorId: input.actorId,
      actorType: input.actorType,
      role: input.role,
      roles: input.roles?.length ? input.roles : [input.role],
      organizationId: input.organizationId,
      refreshToken: tokens.refreshToken,
      refreshJti,
      userAgent: 'api',
      ipAddress: '0.0.0.0',
    });

    return tokens;
  }

  private signTokenPair(
    input: IssueTokenInput,
    sessionId: string,
    familyId: string,
    refreshJti: string,
  ): AuthTokens {
    const roles = input.roles?.length ? input.roles : [input.role];
    const basePayload = {
      sub: input.actorId,
      role: input.role,
      roles,
      actor_type: input.actorType,
      organization_id: input.organizationId ?? null,
      session_id: sessionId,
      family_id: familyId,
    };

    return {
      accessToken: signJwt({ ...basePayload, jti: randomUUID() }, 'access'),
      refreshToken: signJwt({ ...basePayload, jti: refreshJti }, 'refresh'),
    };
  }

  private async findPartnerUser(
    email: string,
  ): Promise<PartnerUserRecord | undefined> {
    const rows = await this.pg.query<DbRow>(
      `
        select pu.id::text, pu.organization_id::text, pu.email, pu.password_hash,
               pu.full_name, pu.role, pu.status, pu.created_at, pu.updated_at
        from partner_users pu
        where lower(pu.email) = lower($1)
        limit 1
      `,
      [email],
    );

    if (rows?.[0]) {
      return {
        id: String(rows[0]['id']),
        organization_id: String(rows[0]['organization_id']),
        email: String(rows[0]['email']),
        password_hash: String(rows[0]['password_hash']),
        full_name: rows[0]['full_name']
          ? String(rows[0]['full_name'])
          : undefined,
        status: String(rows[0]['status']),
        role: String(rows[0]['role'] ?? 'owner'),
        created_at: String(rows[0]['created_at']),
        updated_at: String(rows[0]['updated_at']),
      };
    }

    return undefined;
  }

  private async issuePartnerTokensByPhone(phone: string): Promise<
    AuthTokens & {
      organization_id: string;
      organizationId: string;
      organization_status: string;
      organizationStatus: string;
      partner_role: string;
    }
  > {
    const rows = await this.pg.query<DbRow>(
      `
        select
          po.id::text as organization_id,
          po.status::text as organization_status,
          pu.id::text as user_id,
          pu.status::text as user_status,
          COALESCE(pu.role, 'owner')::text as partner_role
        from partner_organizations po
        left join partner_users pu
          on pu.organization_id = po.id
         and pu.deleted_at is null
        where regexp_replace(po.phone, '\\D', '', 'g') = regexp_replace($1, '\\D', '', 'g')
        order by pu.created_at asc nulls last, po.created_at desc
        limit 1
      `,
      [phone],
    );
    const row = rows[0];

    if (!row || !this.isPartnerLoginStatusAllowed(row['organization_status'])) {
      throw new UnauthorizedException({
        code: 'PARTNER_NOT_ACTIVE',
        message: 'Hamkor tashkilot faol emas',
      });
    }
    const organizationStatus = String(row['organization_status'] ?? '');

    if (row['user_status'] && row['user_status'] !== 'active') {
      throw this.invalidCredentials();
    }

    const organizationId = String(row['organization_id']);
    const actorId = row['user_id'] ? String(row['user_id']) : organizationId;

    return {
      ...(await this.issueTokens({
        actorId,
        actorType: 'partner',
        role: Role.PARTNER,
        organizationId,
      })),
      organization_id: organizationId,
      organizationId,
      organization_status: organizationStatus,
      organizationStatus,
      partner_role: String(row['partner_role'] ?? 'owner'),
    };
  }

  private async issuePartnerTokensByEmail(email: string): Promise<
    AuthTokens & {
      organization_id: string;
      organizationId: string;
      organization_status: string;
      organizationStatus: string;
      partner_role: string;
    }
  > {
    const rows = await this.pg.query<DbRow>(
      `
        select
          po.id::text as organization_id,
          po.status::text as organization_status,
          pu.id::text as user_id,
          pu.status::text as user_status,
          COALESCE(pu.role, 'owner')::text as partner_role
        from partner_organizations po
        left join partner_users pu
          on pu.organization_id = po.id
         and pu.deleted_at is null
        where lower(po.email) = lower($1)
           or lower(pu.email) = lower($1)
        order by pu.created_at asc nulls last, po.created_at desc
        limit 1
      `,
      [email],
    );
    const row = rows[0];

    if (!row || !this.isPartnerLoginStatusAllowed(row['organization_status'])) {
      throw new UnauthorizedException({
        code: 'PARTNER_NOT_ACTIVE',
        message: 'Hamkor tashkilot faol emas',
      });
    }
    const organizationStatus = String(row['organization_status'] ?? '');

    if (row['user_status'] && row['user_status'] !== 'active') {
      throw this.invalidCredentials();
    }

    const organizationId = String(row['organization_id']);
    const actorId = row['user_id'] ? String(row['user_id']) : organizationId;

    return {
      ...(await this.issueTokens({
        actorId,
        actorType: 'partner',
        role: Role.PARTNER,
        organizationId,
      })),
      organization_id: organizationId,
      organizationId,
      organization_status: organizationStatus,
      organizationStatus,
      partner_role: String(row['partner_role'] ?? 'owner'),
    };
  }

  private async assertApprovedPartnerEmail(email: string) {
    const rows = await this.pg.query<DbRow>(
      `
        select po.id::text, po.status::text as organization_status
        from partner_organizations po
        left join partner_users pu
          on pu.organization_id = po.id
         and pu.deleted_at is null
        where lower(po.email) = lower($1) or lower(pu.email) = lower($1)
        limit 1
      `,
      [email],
    );

    if (
      !rows[0] ||
      !this.isPartnerLoginStatusAllowed(rows[0]['organization_status'])
    ) {
      throw new UnauthorizedException({
        code: 'PARTNER_NOT_ACTIVE',
        message: 'Hamkor tashkilot faol emas',
      });
    }
  }

  private isPartnerLoginStatusAllowed(status: unknown): boolean {
    return ['approved', 'blocked', 'suspended'].includes(
      String(status ?? '').toLowerCase(),
    );
  }

  private async findAdminUser(
    login: string,
  ): Promise<AdminUserRecord | undefined> {
    const email = login === 'admin' ? 'admin@safaar.uz' : login;
    const rows = await this.pg.query<DbRow>(
      `
        select id::text, email, password_hash, full_name, role, status,
               totp_secret, created_at, updated_at
        from admin_users
        where lower(email) = lower($1)
        limit 1
      `,
      [email],
    );

    if (rows?.[0]) {
      const role = this.normalizeAdminRole(rows[0]['role']);
      return {
        id: String(rows[0]['id']),
        email: String(rows[0]['email']),
        username: String(rows[0]['email']).split('@')[0],
        password_hash: String(rows[0]['password_hash']),
        full_name: rows[0]['full_name']
          ? String(rows[0]['full_name'])
          : undefined,
        role,
        roles: [role],
        status: String(rows[0]['status']),
        totp_secret: rows[0]['totp_secret']
          ? String(rows[0]['totp_secret'])
          : undefined,
        created_at: String(rows[0]['created_at']),
        updated_at: String(rows[0]['updated_at']),
      };
    }

    return undefined;
  }

  private normalizeAdminRole(value: unknown): Role {
    const role = String(value ?? Role.ADMIN)
      .trim()
      .toUpperCase()
      .replace(/-/g, '_');
    const aliases: Record<string, Role> = {
      SUPER_ADMIN: Role.SUPER_ADMIN,
      ADMIN: Role.ADMIN,
      FINANCE_ADMIN: Role.FINANCE_ADMIN,
      CONTENT_ADMIN: Role.CONTENT_ADMIN,
      SUPPORT_ADMIN: Role.SUPPORT_ADMIN,
      MODERATOR: Role.MODERATOR,
    };
    return aliases[role] ?? Role.ADMIN;
  }

  private publicAdmin(admin: AdminUserRecord) {
    return {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
      status: admin.status,
      has_2fa: Boolean(admin.totp_secret),
    };
  }

  private async verifyPassword(
    hash: string,
    password: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  private oauthConfigured(provider: OAuthProvider): boolean {
    const config = this.oauthConfigValues(provider);
    return Boolean(
      this.oauthValueConfigured(config.clientId) &&
      this.oauthValueConfigured(config.clientSecret) &&
      config.callbackUrl,
    );
  }

  private oauthValueConfigured(value: string | undefined): boolean {
    const normalized = String(value ?? '')
      .trim()
      .toLowerCase();
    return Boolean(
      normalized &&
      !normalized.includes('change_me') &&
      !normalized.startsWith('your_'),
    );
  }

  private oauthConfig(provider: OAuthProvider) {
    const config = this.oauthConfigValues(provider);
    if (
      !this.oauthValueConfigured(config.clientId) ||
      !this.oauthValueConfigured(config.clientSecret) ||
      !config.callbackUrl
    ) {
      throw new ServiceUnavailableException({
        code: 'OAUTH_PROVIDER_NOT_CONFIGURED',
        message: `${provider} OAuth sozlanmagan`,
      });
    }
    return config as {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
  }

  private oauthConfigValues(provider: OAuthProvider) {
    return provider === 'google'
      ? {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackUrl: process.env.GOOGLE_CALLBACK_URL,
        }
      : {
          clientId: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
        };
  }

  private async fetchOAuthProfile(
    provider: OAuthProvider,
    code: string,
  ): Promise<OAuthProfile> {
    const config = this.oauthConfig(provider);
    if (provider === 'google') {
      const token = await this.oauthFetch(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: config.callbackUrl,
            grant_type: 'authorization_code',
            code,
          }),
        },
      );
      const accessToken = String(token['access_token'] ?? '');
      if (!accessToken) throw this.oauthProviderError();
      const profile = await this.oauthFetch(
        'https://openidconnect.googleapis.com/v1/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const email = this.normalizeEmail(profile['email']);
      const emailVerified = profile['email_verified'] === true;
      if (!profile['sub'] || !this.isValidEmail(email) || !emailVerified) {
        throw new UnauthorizedException({
          code: 'OAUTH_EMAIL_REQUIRED',
          message: 'Google tasdiqlagan email manzil talab qilinadi',
        });
      }
      return {
        providerUserId: String(profile['sub']),
        email,
        emailVerified,
        firstName: this.optionalText(profile['given_name']),
        lastName: this.optionalText(profile['family_name']),
      };
    }

    const tokenUrl = new URL(
      'https://graph.facebook.com/v22.0/oauth/access_token',
    );
    tokenUrl.search = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.callbackUrl,
      code,
    }).toString();
    const token = await this.oauthFetch(tokenUrl.toString());
    const accessToken = String(token['access_token'] ?? '');
    if (!accessToken) throw this.oauthProviderError();
    const profileUrl = new URL('https://graph.facebook.com/v22.0/me');
    profileUrl.search = new URLSearchParams({
      fields: 'id,first_name,last_name,email',
      access_token: accessToken,
    }).toString();
    const profile = await this.oauthFetch(profileUrl.toString());
    const email = this.normalizeEmail(profile['email']);
    if (!profile['id'] || !this.isValidEmail(email)) {
      throw new UnauthorizedException({
        code: 'OAUTH_EMAIL_REQUIRED',
        message: 'Facebook profilingizda email ruxsati talab qilinadi',
      });
    }
    return {
      providerUserId: String(profile['id']),
      email,
      emailVerified: true,
      firstName: this.optionalText(profile['first_name']),
      lastName: this.optionalText(profile['last_name']),
    };
  }

  private async oauthFetch(
    url: string,
    init: RequestInit = {},
  ): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: { Accept: 'application/json', ...init.headers },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'OAUTH_PROVIDER_UNAVAILABLE',
        message: 'OAuth provider bilan bog\u2018lanib bo\u2018lmadi',
      });
    }
    const payload = (await response.json().catch(() => null)) as unknown;
    if (!response.ok || !payload || typeof payload !== 'object') {
      throw this.oauthProviderError();
    }
    return payload as Record<string, unknown>;
  }

  private oauthProviderError() {
    return new UnauthorizedException({
      code: 'OAUTH_PROVIDER_REJECTED',
      message: 'OAuth provider so\u2018rovni tasdiqlamadi',
    });
  }

  private async findExistingOAuthUser(
    provider: OAuthProvider,
    providerUserId: string,
    email: string,
  ): Promise<string | null> {
    const linked = await this.pg.query<DbRow>(
      `SELECT usa.user_id::text
       FROM user_social_accounts usa
       JOIN users u ON u.id = usa.user_id
       WHERE usa.provider = $1 AND usa.provider_user_id = $2
         AND u.deleted_at IS NULL AND u.status = 'active'
       LIMIT 1`,
      [provider, providerUserId],
    );
    if (linked?.[0]) {
      return String(linked[0]['user_id']);
    }

    const userRows = await this.pg.query<DbRow>(
      `SELECT id::text
       FROM users
       WHERE lower(email) = lower($1) AND deleted_at IS NULL AND status = 'active'
       LIMIT 1`,
      [email],
    );
    return userRows?.[0] ? String(userRows[0]['id']) : null;
  }

  private async upsertOAuthUser(
    provider: OAuthProvider,
    profile: OAuthProfile,
  ): Promise<string> {
    const now = new Date().toISOString();
    return this.pg.transaction(async (transaction) => {
      const linkedRows = await transaction.query<DbRow>(
        `SELECT usa.user_id::text, u.status::text
         FROM user_social_accounts usa
         JOIN users u ON u.id = usa.user_id
         WHERE usa.provider = $1 AND usa.provider_user_id = $2
         LIMIT 1`,
        [provider, profile.providerUserId],
      );
      if (linkedRows[0]) {
        if (linkedRows[0]['status'] !== 'active') {
          throw new UnauthorizedException({
            code: 'USER_NOT_ACTIVE',
            message: 'Foydalanuvchi hisobi faol emas',
          });
        }
        const userId = String(linkedRows[0]['user_id']);
        await transaction.query(
          `UPDATE user_social_accounts
           SET provider_email = $3, email_verified = $4, updated_at = $5
           WHERE provider = $1 AND provider_user_id = $2`,
          [provider, profile.providerUserId, profile.email, true, now],
        );
        await transaction.query(
          `UPDATE users SET last_login_at = $2, updated_at = $2
           WHERE id = $1::uuid`,
          [userId, now],
        );
        return userId;
      }

      const userRows = await transaction.query<DbRow>(
        `SELECT id::text, status::text
         FROM users
         WHERE lower(email) = lower($1) AND deleted_at IS NULL
         LIMIT 1`,
        [profile.email],
      );
      if (!userRows[0]) {
        throw new UnauthorizedException({
          code: 'OAUTH_ACCOUNT_NOT_REGISTERED',
          message: "Bu Google akkaunt ro'yxatdan o'tmagan",
        });
      }
      if (userRows[0]['status'] !== 'active') {
        throw new UnauthorizedException({
          code: 'USER_NOT_ACTIVE',
          message: 'Foydalanuvchi hisobi faol emas',
        });
      }
      const userId = String(userRows[0]['id']);

      const providerRows = await transaction.query<DbRow>(
        `SELECT provider_user_id
         FROM user_social_accounts
         WHERE user_id = $1::uuid AND provider = $2
         LIMIT 1`,
        [userId, provider],
      );
      if (
        providerRows[0] &&
        providerRows[0]['provider_user_id'] !== profile.providerUserId
      ) {
        throw new BadRequestException({
          code: 'OAUTH_ACCOUNT_ALREADY_LINKED',
          message: 'Bu hisob boshqa ijtimoiy profilga ulangan',
        });
      }

      if (!providerRows[0]) {
        await transaction.query(
          `INSERT INTO user_social_accounts
             (id, user_id, provider, provider_user_id, provider_email,
              email_verified, created_at, updated_at)
           VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $7)`,
          [
            randomUUID(),
            userId,
            provider,
            profile.providerUserId,
            profile.email,
            profile.emailVerified,
            now,
          ],
        );
      }

      await transaction.query(
        `UPDATE users
         SET email_verified_at = coalesce(email_verified_at, $2),
             first_name = coalesce(first_name, $3),
             last_name = coalesce(last_name, $4),
             last_login_at = $2,
             updated_at = $2
         WHERE id = $1::uuid`,
        [userId, now, profile.firstName ?? null, profile.lastName ?? null],
      );
      return userId;
    });
  }

  private oauthUser(row: DbRow | undefined) {
    const id = String(row?.['id'] ?? '');
    const email = this.normalizeEmail(row?.['email']);
    if (!id || !this.isValidEmail(email)) {
      throw new UnauthorizedException({
        code: 'OAUTH_USER_NOT_FOUND',
        message: 'OAuth foydalanuvchi topilmadi',
      });
    }
    return {
      id,
      email,
      firstName: this.optionalText(row?.['first_name']) ?? null,
      lastName: this.optionalText(row?.['last_name']) ?? null,
    };
  }

  private oauthLocale(value: unknown): 'uz' | 'ru' | 'en' {
    const locale = String(value ?? 'uz');
    return locale === 'ru' || locale === 'en' ? locale : 'uz';
  }

  private safeNext(value: unknown): string {
    const next = String(value ?? '');
    return next.startsWith('/') && !next.startsWith('//') ? next : '';
  }

  private optionalText(value: unknown): string | undefined {
    const text = String(value ?? '').trim();
    return text || undefined;
  }

  private oauthStateKey(state: string): string {
    return `auth:oauth:state:${this.opaqueCodeHash(state)}`;
  }

  private oauthExchangeKey(code: string): string {
    return `auth:oauth:exchange:${this.opaqueCodeHash(code)}`;
  }

  private passwordResetKey(token: string): string {
    return `auth:password-reset:${this.opaqueCodeHash(token)}`;
  }

  private async consumePasswordResetToken(token: string): Promise<string> {
    const context = token
      ? await this.cache.take<PasswordResetContext>(
          this.passwordResetKey(token),
        )
      : undefined;
    if (!context?.email) {
      throw new UnauthorizedException({
        code: 'PASSWORD_RESET_TOKEN_INVALID',
        message: 'Parol tiklash sessiyasi yaroqsiz yoki muddati tugagan',
      });
    }
    return context.email;
  }

  private opaqueCodeHash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private invalidCredentials() {
    return new UnauthorizedException({
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Login/parol noto\u2018g\u2018ri',
    });
  }

  private normalizePhone(phone: string): string {
    const digits = String(phone ?? '').replace(/\D/g, '');
    return digits.startsWith('998') ? `+${digits}` : `+998${digits}`;
  }

  private normalizeEmail(email: unknown): string {
    return String(email ?? '')
      .trim()
      .toLowerCase();
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
