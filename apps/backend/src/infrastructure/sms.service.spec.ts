import type { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('refuses to send when SMS_PROVIDER is not set to eskiz', async () => {
    global.fetch = jest.fn();
    const service = new SmsService(config({}));

    await expect(
      service.send({ phone: '+998901234567', text: '123456' }),
    ).rejects.toMatchObject({
      response: { code: 'SMS_PROVIDER_NOT_CONFIGURED' },
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuses to send when eskiz credentials are missing', async () => {
    global.fetch = jest.fn();
    const service = new SmsService(config({ SMS_PROVIDER: 'eskiz' }));

    await expect(
      service.send({ phone: '+998901234567', text: '123456' }),
    ).rejects.toMatchObject({
      response: { code: 'SMS_PROVIDER_NOT_CONFIGURED' },
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('logs in then sends the SMS via the eskiz API', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { data: { token: 'eskiz-token' } }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: 'sms-1' }));
    global.fetch = fetchMock;

    const service = new SmsService(
      config({
        SMS_PROVIDER: 'eskiz',
        ESKIZ_EMAIL: 'ops@safaar.uz',
        ESKIZ_PASSWORD: 'secret',
        ESKIZ_FROM: 'safaar',
      }),
    );

    const result = await service.send({
      phone: '+998 90 123-45-67',
      text: 'Safaar kirish kodingiz: 123456',
    });

    expect(result).toEqual({ providerMessageId: 'sms-1', accepted: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://notify.eskiz.uz/api/auth/login',
    );
    const sendCall = fetchMock.mock.calls[1];
    expect(sendCall?.[0]).toBe('https://notify.eskiz.uz/api/message/sms/send');
    const sendInit = sendCall?.[1] as RequestInit;
    expect(sendInit.headers).toMatchObject({
      Authorization: 'Bearer eskiz-token',
    });
    expect(JSON.parse(String(sendInit.body))).toEqual({
      mobile_phone: '998901234567',
      message: 'Safaar kirish kodingiz: 123456',
      from: 'safaar',
    });
  });

  it('re-authenticates once and retries when the cached token has expired (401)', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { data: { token: 'stale-token' } }),
      )
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(
        jsonResponse(200, { data: { token: 'fresh-token' } }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: 'sms-2' }));
    global.fetch = fetchMock;

    const service = new SmsService(
      config({
        SMS_PROVIDER: 'eskiz',
        ESKIZ_EMAIL: 'ops@safaar.uz',
        ESKIZ_PASSWORD: 'secret',
      }),
    );

    const result = await service.send({
      phone: '+998901234567',
      text: '123456',
    });

    expect(result).toEqual({ providerMessageId: 'sms-2', accepted: true });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('throws SMS_PROVIDER_UNAVAILABLE when the eskiz login request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(500, {}));
    const service = new SmsService(
      config({
        SMS_PROVIDER: 'eskiz',
        ESKIZ_EMAIL: 'ops@safaar.uz',
        ESKIZ_PASSWORD: 'secret',
      }),
    );

    await expect(
      service.send({ phone: '+998901234567', text: '123456' }),
    ).rejects.toMatchObject({
      response: { code: 'SMS_PROVIDER_UNAVAILABLE' },
    });
  });

  it('throws SMS_SEND_FAILED when the eskiz send request is rejected', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { data: { token: 'eskiz-token' } }),
      )
      .mockResolvedValueOnce(
        jsonResponse(400, { message: 'Balance yetarli emas' }),
      );

    const service = new SmsService(
      config({
        SMS_PROVIDER: 'eskiz',
        ESKIZ_EMAIL: 'ops@safaar.uz',
        ESKIZ_PASSWORD: 'secret',
      }),
    );

    await expect(
      service.send({ phone: '+998901234567', text: '123456' }),
    ).rejects.toMatchObject({
      response: { code: 'SMS_SEND_FAILED', message: 'Balance yetarli emas' },
    });
  });
});

function config(values: Record<string, string | undefined>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
