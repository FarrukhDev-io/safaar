import { PostgresService } from '../infrastructure/postgres.service';
import { ExportDataService } from './export-data.service';

describe('ExportDataService.resolve', () => {
  let service: ExportDataService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>>;

  beforeEach(() => {
    pg = { query: jest.fn().mockResolvedValue([]) };
    service = new ExportDataService(pg as unknown as PostgresService);
  });

  const knownTypes: Array<[string, string]> = [
    ['personal-data', 'user-1'],
    ['admin-users', 'admin-1'],
    ['admin-partners', 'admin-1'],
    ['admin-finance', 'admin-1'],
    ['tax-report', 'admin-1'],
    ['partner-bookings', 'partner-1'],
    ['partner-finance', 'partner-1'],
  ];

  it.each(knownTypes)(
    'resolves "%s" without throwing and returns a well-shaped result',
    async (type, ownerId) => {
      const result = await service.resolve('any-owner-type', ownerId, type);
      expect(['tabular', 'json']).toContain(result.kind);
      expect(typeof result.title).toBe('string');
      expect(result.title.length).toBeGreaterThan(0);
    },
  );

  it('personal-data returns a json-kind result', async () => {
    const result = await service.resolve('user', 'user-1', 'personal-data');
    expect(result.kind).toBe('json');
  });

  it('admin-users returns a tabular result with the expected columns', async () => {
    const result = await service.resolve('admin', 'admin-1', 'admin-users');
    expect(result.kind).toBe('tabular');
    if (result.kind === 'tabular') {
      expect(result.columns.map((c) => c.key)).toContain('email');
    }
  });

  it('rejects an unknown export type', async () => {
    await expect(
      service.resolve('user', 'user-1', 'not-a-real-type'),
    ).rejects.toThrow(/Noma'lum export turi/);
  });
});
