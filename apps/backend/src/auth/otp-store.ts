import { randomInt, randomUUID } from 'node:crypto';
import { hashSecret } from './security';

export type OtpPurpose = 'user_login' | 'partner_login' | 'password_reset';

export interface OtpChallenge {
  id: string;
  phone: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  expiresAt: number;
  resendAfter: number;
  createdAt: string;
}

const otpTtlMs = 5 * 60_000;
const resendMs = 60_000;
const maxAttempts = 5;
const maxPerHour = 8;

class OtpStore {
  private readonly challenges = new Map<string, OtpChallenge>();
  private readonly phoneRate = new Map<string, number[]>();
  private readonly deliveryCodes = new Map<string, string>();

  create(phone: string, purpose: OtpPurpose): OtpChallenge {
    this.assertRateLimit(phone);
    const code = randomInt(100_000, 1_000_000).toString();
    const challenge: OtpChallenge = {
      id: randomUUID(),
      phone,
      purpose,
      codeHash: hashSecret(code, this.otpPepper(phone, purpose)),
      attempts: 0,
      expiresAt: Date.now() + otpTtlMs,
      resendAfter: Date.now() + resendMs,
      createdAt: new Date().toISOString(),
    };

    this.challenges.set(challenge.id, challenge);
    this.deliveryCodes.set(challenge.id, code);
    return challenge;
  }

  consume(input: {
    challengeId?: string;
    phone: string;
    purpose: OtpPurpose;
    code: string;
  }): void {
    const challenge = this.findChallenge(input);
    if (!challenge || challenge.expiresAt <= Date.now()) {
      throw new Error('OTP_EXPIRED');
    }

    challenge.attempts += 1;
    const expectedHash = hashSecret(
      input.code,
      this.otpPepper(input.phone, input.purpose),
    );

    if (
      challenge.attempts > maxAttempts ||
      challenge.codeHash !== expectedHash
    ) {
      throw new Error('OTP_INVALID');
    }

    this.challenges.delete(challenge.id);
    this.deliveryCodes.delete(challenge.id);
  }

  getDeliveryCode(challengeId: string): string | undefined {
    return this.deliveryCodes.get(challengeId);
  }

  private findChallenge(input: {
    challengeId?: string;
    phone: string;
    purpose: OtpPurpose;
  }): OtpChallenge | undefined {
    if (input.challengeId) {
      const challenge = this.challenges.get(input.challengeId);
      if (
        challenge?.phone === input.phone &&
        challenge.purpose === input.purpose
      ) {
        return challenge;
      }
      return undefined;
    }

    return [...this.challenges.values()]
      .filter(
        (challenge) =>
          challenge.phone === input.phone &&
          challenge.purpose === input.purpose,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  private assertRateLimit(phone: string) {
    const now = Date.now();
    const windowStart = now - 60 * 60_000;
    const hits = (this.phoneRate.get(phone) ?? []).filter(
      (value) => value > windowStart,
    );

    if (hits.length >= maxPerHour) {
      throw new Error('OTP_RATE_LIMITED');
    }

    hits.push(now);
    this.phoneRate.set(phone, hits);
  }

  private otpPepper(phone: string, purpose: OtpPurpose): string {
    return `${process.env.OTP_PEPPER ?? 'safaar-dev-otp-pepper'}:${purpose}:${phone}`;
  }
}

export const otpStore = new OtpStore();
