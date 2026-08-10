import { PostgresService } from '../infrastructure/postgres.service';
import { WebhookDeliveryService } from './webhook-delivery.service';

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
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('marks delivery as delivered on a 2xx response', async () => {
    pg.query.mockResolvedValueOnce([deliveryRow]).mockResolvedValueOnce([]);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"ok":true}'),
    });

    await service.deliver('delivery-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://partner.example.com/webhook',
      expect.objectContaining({ method: 'POST' }),
    );
    const updateCall = pg.query.mock.calls[1]!;
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
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('server error'),
    });

    await expect(service.deliver('delivery-1')).rejects.toThrow();

    const updateCall = pg.query.mock.calls[1]!;
    expect((updateCall[1] as unknown[])[0]).toBe('failed');
    expect((updateCall[1] as unknown[])[1]).toBe(500);
  });

  it('marks delivery as failed when the network request throws AND rethrows (regression: C-4)', async () => {
    pg.query.mockResolvedValueOnce([deliveryRow]).mockResolvedValueOnce([]);
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(service.deliver('delivery-1')).rejects.toThrow(
      'ECONNREFUSED',
    );

    const updateCall = pg.query.mock.calls[1]!;
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
    const updateCall = pg.query.mock.calls[1]!;
    expect((updateCall[1] as unknown[])[0]).toBe('skipped');
  });

  it('does nothing (does not throw) when the delivery row is missing', async () => {
    pg.query.mockResolvedValueOnce([]);

    await expect(service.deliver('missing-id')).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
