import { AppCacheService } from '../infrastructure/cache.service';
import { PostgresService } from '../infrastructure/postgres.service';
import { HotelsService } from './hotels.service';

describe('HotelsService.findAll', () => {
  let service: HotelsService;
  let cache: AppCacheService;
  let pg: jest.Mocked<PostgresService>;

  beforeEach(() => {
    cache = {
      getOrSet: jest
        .fn()
        .mockImplementation(
          (_key: string, _ttl: number, producer: () => Promise<unknown>) =>
            producer(),
        ),
    } as unknown as AppCacheService;

    pg = {
      query: jest.fn(),
    } as unknown as jest.Mocked<PostgresService>;

    service = new HotelsService(cache, pg);
  });

  it('applies pagination in SQL before loading listing side data', async () => {
    pg.query
      .mockResolvedValueOnce([
        {
          id: '00000000-0000-4000-8000-000000000001',
          partner_organization_id: 'partner-1',
          slug: 'hotel-one',
          city_id: 'city-1',
          address: 'Address',
          latitude: 41.31,
          longitude: 69.28,
          stars: 4,
          rating_average: 4.8,
          reviews_count: 12,
          status: 'published',
          featured: false,
          check_in_time: '14:00',
          check_out_time: '12:00',
          created_at: '2026-08-04T00:00:00.000Z',
          updated_at: '2026-08-04T00:00:00.000Z',
          name: { uz: 'Hotel One' },
          description: { uz: 'Description' },
          city_name: { uz: 'Toshkent' },
          region_id: 'region-1',
          min_price: 120000,
          total_count: 12,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.findAll({
      page: '2',
      limit: '5',
      sort_by: 'min_price',
      order: 'asc',
    });

    const [sql, params] = pg.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('COUNT(*) OVER()::int AS total_count');
    expect(sql).toContain('ORDER BY COALESCE(rp.min_price, 0) ASC');
    expect(sql).toContain('LIMIT $1 OFFSET $2');
    expect(params).toEqual([5, 5]);
    expect(pg.query.mock.calls[1]?.[1]).toEqual([
      ['00000000-0000-4000-8000-000000000001'],
    ]);
    expect(result).toMatchObject({
      total: 12,
      page: 2,
      limit: 5,
      total_pages: 3,
    });
    expect(result.items).toHaveLength(1);
  });
});
