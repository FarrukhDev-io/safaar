import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

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
});

function config(values: Record<string, string | undefined>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}
