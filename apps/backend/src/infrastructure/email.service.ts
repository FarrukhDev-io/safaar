import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailMessage } from '../integrations/email/email-provider.interface';

@Injectable()
export class EmailService {
  private readonly host?: string;
  private readonly port: number;
  private readonly user?: string;
  private readonly pass?: string;
  private readonly from?: string;
  private readonly resendApiKey?: string;
  private readonly resendFrom?: string;
  private transporter?: Transporter;

  constructor(config: ConfigService) {
    this.host = smtpHost(config.get<string>('SMTP_HOST'));
    this.port = Number(config.get<string>('SMTP_PORT') ?? 587);
    this.user = config.get<string>('SMTP_USER');
    this.pass = config.get<string>('SMTP_PASS');
    this.from = config.get<string>('SMTP_FROM') ?? this.user ?? '';
    this.resendApiKey = config.get<string>('RESEND_API_KEY');
    this.resendFrom = config.get<string>('RESEND_FROM');
  }

  async send(message: EmailMessage) {
    // Ko'p cloud-hosting provayderlar (Railway va h.k.) chiquvchi SMTP portlarini
    // bloklaydi yoki Gmail ularning IP'laridan ulanishni rad etadi — shuning uchun
    // production'da HTTPS orqali ishlaydigan Resend API'si ustuvor ishlatiladi.
    if (this.resendApiKey) {
      return this.sendViaResend(message);
    }

    const transporter = this.getTransporter();
    const result: unknown = await transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    const parsed = parseMailResult(result);

    return {
      providerMessageId: parsed.providerMessageId,
      accepted: parsed.accepted,
    };
  }

  private async sendViaResend(message: EmailMessage) {
    let fromAddress = this.resendFrom || this.from;
    if (!fromAddress || fromAddress.includes('@gmail.com')) {
      fromAddress = 'onboarding@resend.dev';
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    const body = (await response.json().catch(() => null)) as {
      id?: string;
      message?: string;
    } | null;

    if (!response.ok) {
      throw new ServiceUnavailableException({
        code: 'EMAIL_SEND_FAILED',
        message: body?.message ?? 'Email yuborib bo\'lmadi',
      });
    }

    return {
      providerMessageId: body?.id ?? '',
      accepted: true,
    };
  }

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    if (!this.host || !this.user || !this.pass || !this.from) {
      throw new ServiceUnavailableException({
        code: 'EMAIL_NOT_CONFIGURED',
        message: 'Email yuborish sozlanmagan',
      });
    }

    this.transporter = nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: this.port === 465,
      auth: {
        user: this.user,
        pass: this.pass,
      },
    });

    return this.transporter;
  }
}

function smtpHost(value: string | undefined): string | undefined {
  if (!value) {
    return 'smtp.gmail.com';
  }

  const host = value.trim();
  if (!host || host.includes('@')) {
    return 'smtp.gmail.com';
  }

  return host;
}

function parseMailResult(value: unknown) {
  if (!value || typeof value !== 'object') {
    return { providerMessageId: '', accepted: false };
  }

  const result = value as {
    messageId?: unknown;
    accepted?: unknown;
  };
  return {
    providerMessageId:
      typeof result.messageId === 'string' ? result.messageId : '',
    accepted: Array.isArray(result.accepted) && result.accepted.length > 0,
  };
}
