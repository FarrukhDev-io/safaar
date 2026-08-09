import { NotFoundException } from '@nestjs/common';
import { AppCacheService } from '../infrastructure/cache.service';
import { PostgresService } from '../infrastructure/postgres.service';
import { CmsService } from './cms.service';

describe('CmsService pages', () => {
  let service: CmsService;
  let postgres: jest.Mocked<Pick<PostgresService, 'query'>>;
  let cache: {
    getOrSet: jest.Mock;
  };

  beforeEach(() => {
    postgres = {
      query: jest.fn(),
    };
    cache = {
      getOrSet: jest.fn(
        async <T>(
          _key: string,
          _ttl: number,
          producer: () => Promise<T> | T,
        ): Promise<T> => Promise.resolve(producer()),
      ),
    };
    service = new CmsService(
      cache as unknown as AppCacheService,
      postgres as unknown as PostgresService,
    );
  });

  it('returns published CMS pages with text helpers for the user panel', async () => {
    postgres.query.mockResolvedValue([
      {
        id: '00000000-0000-7005-0000-000000000004',
        type: 'page',
        slug: 'about',
        title: { uz: 'Biz haqimizda', ru: null, en: 'About us' },
        body: { uz: 'Safaar haqida matn', ru: null, en: null },
        status: 'published',
        metadata: { menu: 'footer', seoTitle: 'Biz haqimizda' },
        published_at: '2026-08-05T07:00:00.000Z',
        created_at: '2026-08-05T07:00:00.000Z',
        updated_at: '2026-08-05T07:00:00.000Z',
      },
    ]);

    await expect(service.collection('pages')).resolves.toEqual([
      expect.objectContaining({
        slug: 'about',
        title_text: 'Biz haqimizda',
        body_text: 'Safaar haqida matn',
        content: 'Safaar haqida matn',
        seo_title: 'Biz haqimizda',
      }),
    ]);
    expect(postgres.query).toHaveBeenCalledWith(
      expect.stringContaining("status IN ('published', 'active')"),
      [['page']],
    );
  });

  it('loads one public page by slug and hides missing drafts', async () => {
    postgres.query.mockResolvedValueOnce([]);

    await expect(service.one('pages', 'draft-page')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(cache.getOrSet).toHaveBeenCalledWith(
      'cms:entry:pages:draft-page',
      300,
      expect.any(Function),
    );
  });
});
