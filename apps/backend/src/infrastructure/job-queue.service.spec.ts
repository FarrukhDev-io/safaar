import { ConfigService } from '@nestjs/config';
import { JobQueueService } from './job-queue.service';

const addMock = jest.fn().mockResolvedValue(undefined);

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: addMock,
    close: jest.fn(),
  })),
}));

describe('JobQueueService (regression: BullMQ rejects ":" in custom jobId)', () => {
  beforeEach(() => {
    addMock.mockClear();
  });

  function makeService(): JobQueueService {
    const config = {
      get: (key: string) =>
        key === 'QUEUE_REDIS_URL' ? 'redis://localhost:6379/1' : undefined,
    } as unknown as ConfigService;
    return new JobQueueService(config);
  }

  it('strips ":" from idempotencyKey-derived jobId before handing it to BullMQ', async () => {
    const service = makeService();

    await service.add(
      'partner-export',
      { export_id: 'x' },
      { idempotencyKey: 'partner-export:org-1:partner-bookings:csv' },
    );

    expect(addMock).toHaveBeenCalledTimes(1);
    const [, , bullOptions] = addMock.mock.calls[0]!;
    expect(bullOptions.jobId).toBe('partner-export_org-1_partner-bookings_csv');
    expect(bullOptions.jobId).not.toContain(':');
  });

  it('keeps the original (colon-containing) id for in-memory idempotency tracking', async () => {
    const service = makeService();
    const key = 'user-data-export:user-1';

    const first = await service.add(
      'user-data-export',
      { a: 1 },
      { idempotencyKey: key },
    );
    const second = await service.add(
      'user-data-export',
      { a: 2 },
      { idempotencyKey: key },
    );

    expect(first.id).toBe(key);
    expect(second).toBe(first);
    // Ikkinchi chaqiruv memoryJobs'dan qaytadi — BullMQ'ga qayta yuborilmaydi.
    expect(addMock).toHaveBeenCalledTimes(1);
  });
});
