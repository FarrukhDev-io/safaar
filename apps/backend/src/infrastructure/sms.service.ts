import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SmsMessage } from '../integrations/sms/sms-provider.interface';

const ESKIZ_BASE_URL = 'https://notify.eskiz.uz/api';

@Injectable()
export class SmsService {
  private readonly provider?: string;
  private readonly eskizEmail?: string;
  private readonly eskizPassword?: string;
  private readonly eskizFrom: string;
  private tokenPromise?: Promise<string>;

  constructor(config: ConfigService) {
    this.provider = config.get<string>('SMS_PROVIDER');
    this.eskizEmail = config.get<string>('ESKIZ_EMAIL');
    this.eskizPassword = config.get<string>('ESKIZ_PASSWORD');
    this.eskizFrom = config.get<string>('ESKIZ_FROM') ?? '4546';
  }

  async send(
    message: SmsMessage,
  ): Promise<{ providerMessageId: string; accepted: boolean }> {
    if (this.provider !== 'eskiz' || !this.eskizEmail || !this.eskizPassword) {
      throw new ServiceUnavailableException({
        code: 'SMS_PROVIDER_NOT_CONFIGURED',
        message: 'SMS provayder ulanmagan',
      });
    }

    try {
      return await this.sendViaEskiz(message, await this.getToken());
    } catch (error) {
      if (error instanceof EskizAuthExpiredError) {
        this.tokenPromise = undefined;
        return this.sendViaEskiz(message, await this.getToken());
      }
      throw error;
    }
  }

  private async sendViaEskiz(message: SmsMessage, token: string) {
    const response = await fetch(`${ESKIZ_BASE_URL}/message/sms/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobile_phone: message.phone.replace(/\D/g, ''),
        message: message.text,
        from: this.eskizFrom,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (response.status === 401) {
      throw new EskizAuthExpiredError();
    }

    const body = (await response.json().catch(() => null)) as {
      id?: string;
      message?: string;
    } | null;

    if (!response.ok) {
      throw new ServiceUnavailableException({
        code: 'SMS_SEND_FAILED',
        message: body?.message ?? "SMS yuborib bo'lmadi",
      });
    }

    return {
      providerMessageId: body?.id ?? '',
      accepted: true,
    };
  }

  private async getToken(): Promise<string> {
    if (!this.tokenPromise) {
      this.tokenPromise = this.login().catch((error) => {
        this.tokenPromise = undefined;
        throw error;
      });
    }
    return this.tokenPromise;
  }

  private async login(): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${ESKIZ_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.eskizEmail,
          password: this.eskizPassword,
        }),
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'SMS_PROVIDER_UNAVAILABLE',
        message: "SMS provayder bilan bog'lanib bo'lmadi",
      });
    }

    const body = (await response.json().catch(() => null)) as {
      data?: { token?: string };
    } | null;
    const token = body?.data?.token;

    if (!response.ok || !token) {
      throw new ServiceUnavailableException({
        code: 'SMS_PROVIDER_UNAVAILABLE',
        message: "SMS provayder bilan bog'lanib bo'lmadi",
      });
    }

    return token;
  }
}

class EskizAuthExpiredError extends Error {}
