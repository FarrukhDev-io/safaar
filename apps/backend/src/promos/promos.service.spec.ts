import { PostgresService } from '../infrastructure/postgres.service';
import { PromosService } from './promos.service';

describe('PromosService.redeem (regression: H-2 usage_limit was decorative)', () => {
  let pg: { query: jest.Mock };
  let service: PromosService;

  beforeEach(() => {
    pg = { query: jest.fn() };
    service = new PromosService(pg as unknown as PostgresService);
  });

  it('increments used_count atomically when still under the limit', async () => {
    pg.query.mockResolvedValueOnce([{ id: 'promo-1' }]);

    const result = await service.redeem('ONE_USE');

    expect(result).toBe(true);
    const [sql, params] = pg.query.mock.calls[0]!;
    expect(String(sql)).toContain('jsonb_set');
    expect(String(sql)).toContain("usedCount")
    expect(params).toEqual(['one_use']);
  });

  it('returns false (does not redeem) once the usage limit is reached', async () => {
    pg.query.mockResolvedValueOnce([]); // WHERE bound check excluded the row

    const result = await service.redeem('ONE_USE');

    expect(result).toBe(false);
  });

  it('returns false for an empty code without querying the database', async () => {
    const result = await service.redeem('   ');

    expect(result).toBe(false);
    expect(pg.query).not.toHaveBeenCalled();
  });

  it('the same UPDATE statement enforces the cap in its own WHERE clause (no separate check-then-write)', async () => {
    pg.query.mockResolvedValueOnce([{ id: 'promo-1' }]);

    await service.redeem('ONE_USE');

    const [sql] = pg.query.mock.calls[0]!;
    expect(String(sql)).toContain('usageLimit');
    expect(String(sql).toLowerCase()).toContain('update cms_entries');
  });
});

describe('PromosService.validate', () => {
  let pg: { query: jest.Mock };
  let service: PromosService;

  beforeEach(() => {
    pg = { query: jest.fn() };
    service = new PromosService(pg as unknown as PostgresService);
  });

  it('does not increment used_count merely by validating (read-only check)', async () => {
    pg.query.mockResolvedValueOnce([
      {
        id: 'promo-1',
        code: 'ONE_USE',
        discount_type: 'percentage',
        discount_value: 10,
        usage_limit: 1,
        used_count: 0,
        valid_until: new Date(Date.now() + 86_400_000).toISOString(),
      },
    ]);

    const result = await service.validate({ code: 'ONE_USE' });

    expect(result.valid).toBe(true);
    const [sql] = pg.query.mock.calls[0]!;
    expect(String(sql).toLowerCase()).toContain('select');
    expect(String(sql).toLowerCase()).not.toContain('update');
  });

  it('reports invalid once used_count has reached usage_limit', async () => {
    pg.query.mockResolvedValueOnce([
      {
        id: 'promo-1',
        code: 'ONE_USE',
        discount_type: 'percentage',
        discount_value: 10,
        usage_limit: 1,
        used_count: 1,
        valid_until: new Date(Date.now() + 86_400_000).toISOString(),
      },
    ]);

    const result = await service.validate({ code: 'ONE_USE' });

    expect(result.valid).toBe(false);
  });
});
