import { PostgresService } from '../infrastructure/postgres.service';
import { WebhookDeliveryService } from './webhook-delivery.service';

jest.mock('../common/ssrf-guard', () => ({
  assertPublicHttpUrl: jest.fn((rawUrl: string) =>
    Promise.resolve(new URL(rawUrl)),
  ),
}));

import { assertPublicHttpUrl } from '../common/ssrf-guard';

function jsonResponse(
  overrides: Partial<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
    location: string | null;
  }>,
) {
  const location = overrides.location ?? null;
  return {
    ok: overrides.ok ?? true,
    status: overrides.status ?? 200,
    text: overrides.text ?? (() => Promise.resolve('')),
    headers: { get: (name: string) => (name === 'location' ? location : null) },
  };
}

describe('WebhookDeliveryService', () => {
  let service: WebhookDeliveryService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>>;
  let fetchMock: jest.Mock;

  const deliveryRow = {
    id: 'delivery-1',
    endpoint_id: 'endpoint-1',
    event_type: 'booking.created',
    payload: { booking_id: 'b1' },
    url: 'https://partner.example.com/webhook',
    endpoint_status: 'active',
  };

  beforeEach(() => {
    pg = { query: jest.fn() };
    service = new WebhookDeliveryService(pg as unknown as PostgresService);
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    (assertPublicHttpUrl as jest.Mock).mockClear();
    (assertPublicHttpUrl as jest.Mock).mockImplementation((rawUrl: string) =>
      Promise.resolve(new URL(rawUrl)),
    );
  });

  it('marks delivery as delivered on a 2xx response', async () => {
    pg.query.mockResolvedValueOnce([deliveryRow]).mockResolvedValueOnce([]);
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ status: 200, text: () => Promise.resolve('{"ok":true}') }),
    );

    await service.deliver('delivery-1');

    expect(assertPublicHttpUrl).toHaveBeenCalledWith(
      'https://partner.example.com/webhook',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://partner.example.com/webhook',
      expect.objectContaining({ method: 'POST', redirect: 'manual' }),
    );
    const updateCall = pg.query.mock.calls[1];
    expect(updateCall[1]).toEqual([
      'delivered',
      200,
      '{"ok":true}',
      expect.any(String),
      'delivery-1',
    ]);
  });

  it('marks delivery as failed on a non-2xx response AND rethrows so BullMQ retries (regression: C-4)', async () => {
    pg.query.mockResolvedValueOnce([deliveryRow]).mockResolvedValueOnce([]);
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        ok: false,
        status: 500,
        text: () => Promise.resolve('server error'),
      }),
    );

    await expect(service.deliver('delivery-1')).rejects.toThrow();

    const updateCall = pg.query.mock.calls[1];
    expect((updateCall[1] as unknown[])[0]).toBe('failed');
    expect((updateCall[1] as unknown[])[1]).toBe(500);
  });

  it('marks delivery as failed when the network request throws AND rethrows (regression: C-4)', async () => {
    pg.query.mockResolvedValueOnce([deliveryRow]).mockResolvedValueOnce([]);
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(service.deliver('delivery-1')).rejects.toThrow('ECONNREFUSED');

    const updateCall = pg.query.mock.calls[1];
    expect((updateCall[1] as unknown[])[0]).toBe('failed');
    expect((updateCall[1] as unknown[])[1]).toBeNull();
    expect((updateCall[1] as unknown[])[2]).toContain('ECONNREFUSED');
  });

  it('skips delivery when the endpoint is not active', async () => {
    pg.query
      .mockResolvedValueOnce([{ ...deliveryRow, endpoint_status: 'disabled' }])
      .mockResolvedValueOnce([]);

    await service.deliver('delivery-1');

    expect(fetchMock).not.toHaveBeenCalled();
    const updateCall = pg.query.mock.calls[1];
    expect((updateCall[1] as unknown[])[0]).toBe('skipped');
  });

  it('does nothing (does not throw) when the delivery row is missing', async () => {
    pg.query.mockResolvedValueOnce([]);

    await expect(service.deliver('missing-id')).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects the delivery before ever calling fetch when the stored URL now fails SSRF validation (DNS changed since creation)', async () => {
    pg.query.mockResolvedValueOnce([deliveryRow]).mockResolvedValueOnce([]);
    (assertPublicHttpUrl as jest.Mock).mockRejectedValueOnce(
      new Error('WEBHOOK_URL_NOT_ALLOWED'),
    );

    await expect(service.deliver('delivery-1')).rejects.toThrow(
      'WEBHOOK_URL_NOT_ALLOWED',
    );

    expect(fetchMock).not.toHaveBeenCalled();
    const updateCall = pg.query.mock.calls[1];
    expect((updateCall[1] as unknown[])[0]).toBe('failed');
  });

  it('follows a redirect only after re-validating the Location target, and rejects a redirect into a private IP', async () => {
    pg.query.mockResolvedValueOnce([deliveryRow]).mockResolvedValueOnce([]);
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        status: 302,
        location: 'https://internal.attacker.example/steal',
      }),
    );
    (assertPublicHttpUrl as jest.Mock)
      .mockResolvedValueOnce(new URL('https://partner.example.com/webhook'))
      .mockRejectedValueOnce(new Error('WEBHOOK_URL_NOT_ALLOWED'));

    await expect(service.deliver('delivery-1')).rejects.toThrow(
      'WEBHOOK_URL_NOT_ALLOWED',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(assertPublicHttpUrl).toHaveBeenCalledWith(
      'https://internal.attacker.example/steal',
    );
  });
});
