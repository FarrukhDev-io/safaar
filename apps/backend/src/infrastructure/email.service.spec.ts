import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer');

describe('EmailService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('rejects Resend in production when only a Gmail sender is configured', async () => {
    global.fetch = jest.fn();
    const service = new EmailService(
      config({
        NODE_ENV: 'production',
        RESEND_API_KEY: 'resend-key',
        SMTP_FROM: 'Safaar <sender@gmail.com>',
      }),
    );

    await expect(
      service.send({
        to: 'partner@example.com',
        subject: 'Safaar kodi',
        text: '123456',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('allows the Resend onboarding sender only outside production', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'email-id' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const service = new EmailService(
      config({
        NODE_ENV: 'development',
        RESEND_API_KEY: 'resend-key',
        SMTP_FROM: 'Safaar <sender@gmail.com>',
      }),
    );

    const result = await service.send({
      to: 'partner@example.com',
      subject: 'Safaar kodi',
      text: '123456',
    });

    expect(result).toEqual({ providerMessageId: 'email-id', accepted: true });
    const calls = (global.fetch as jest.MockedFunction<typeof fetch>).mock
      .calls;
    const requestInit = calls[0]?.[1];
    expect(calls[0]?.[0]).toBe('https://api.resend.com/emails');
    expect(String(requestInit?.body)).toContain('onboarding@resend.dev');
  });

  it('configures the SMTP transport with bounded timeouts (regression: M-5, no default ~2min hang)', async () => {
    const sendMail = jest.fn().mockResolvedValue({ accepted: ['to@x.com'] });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

    const service = new EmailService(
      config({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user@example.com',
        SMTP_PASS: 'secret',
        SMTP_FROM: 'Safaar <noreply@safaar.uz>',
      }),
    );

    await service.send({
      to: 'partner@example.com',
      subject: 'Safaar kodi',
      text: '123456',
      html: '<p>123456</p>',
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionTimeout: expect.any(Number),
        greetingTimeout: expect.any(Number),
        socketTimeout: expect.any(Number),
      }),
    );
    const options = (nodemailer.createTransport as jest.Mock).mock.calls[0]![0];
    expect(options.connectionTimeout).toBeLessThanOrEqual(15_000);
    expect(options.greetingTimeout).toBeLessThanOrEqual(15_000);
    expect(options.socketTimeout).toBeLessThanOrEqual(15_000);
  });

  it('propagates an SMTP send failure as a rejected promise (caller decides how to respond)', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

    const service = new EmailService(
      config({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user@example.com',
        SMTP_PASS: 'secret',
        SMTP_FROM: 'Safaar <noreply@safaar.uz>',
      }),
    );

    await expect(
      service.send({
        to: 'partner@example.com',
        subject: 'Safaar kodi',
        text: '123456',
        html: '<p>123456</p>',
      }),
    ).rejects.toThrow('ECONNREFUSED');
  });
});

function config(values: Record<string, string | undefined>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}
