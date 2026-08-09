import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { PostgresService } from '../infrastructure/postgres.service';
import { UploadsService } from '../uploads/uploads.service';
import { ExportsService } from './exports.service';

describe('ExportsService.download (regression: no more fake "always ready")', () => {
  let service: ExportsService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>>;
  let uploads: { signDocumentDownload: jest.Mock };

  const owner: RequestActor = {
    id: 'user-1',
    actorType: 'user',
    role: Role.USER,
    roles: [Role.USER],
  };

  beforeEach(() => {
    pg = { query: jest.fn() };
    uploads = { signDocumentDownload: jest.fn() };
    service = new ExportsService(
      pg as unknown as PostgresService,
      uploads as unknown as UploadsService,
    );
  });

  it('returns a real presigned URL when the export is ready', async () => {
    pg.query.mockResolvedValueOnce([
      {
        id: 'export-1',
        owner_id: 'user-1',
        status: 'ready',
        download_key: 'export/user/user-1/export-1.csv',
      },
    ]);
    uploads.signDocumentDownload.mockResolvedValueOnce(
      'https://r2.example.com/signed?x=1',
    );

    const result = await service.download(owner, 'export-1');

    expect(uploads.signDocumentDownload).toHaveBeenCalledWith(
      'export/user/user-1/export-1.csv',
    );
    expect(result.download_url).toBe('https://r2.example.com/signed?x=1');
    // Enг muhimi: bu endi bazani MUTATE qilmaydi (avvalgi xatti-harakat
    // har chaqiruvda status='ready' deb "soxta" yozib qo'yardi).
    expect(pg.query).toHaveBeenCalledTimes(1);
  });

  it('returns a null download_url without calling R2 when the job is still queued', async () => {
    pg.query.mockResolvedValueOnce([
      { id: 'export-1', owner_id: 'user-1', status: 'queued', download_key: null },
    ]);

    const result = await service.download(owner, 'export-1');

    expect(result).toEqual({ id: 'export-1', status: 'queued', download_url: null });
    expect(uploads.signDocumentDownload).not.toHaveBeenCalled();
  });

  it('throws a clear error when the export generation failed', async () => {
    pg.query.mockResolvedValueOnce([
      {
        id: 'export-1',
        owner_id: 'user-1',
        status: 'failed',
        error: 'xlsx export hali qoʻllab-quvvatlanmaydi',
      },
    ]);

    await expect(service.download(owner, 'export-1')).rejects.toMatchObject({
      status: 422,
    });
  });

  it('rejects downloading another user’s export (403)', async () => {
    pg.query.mockResolvedValueOnce([
      { id: 'export-1', owner_id: 'someone-else', status: 'ready' },
    ]);

    await expect(service.download(owner, 'export-1')).rejects.toMatchObject({
      status: 403,
    });
  });

  it('allows a partner actor to access an export owned by their organization_id (regression)', async () => {
    const partnerActor: RequestActor = {
      id: 'partner-user-1',
      actorType: 'partner',
      role: Role.PARTNER,
      roles: [Role.PARTNER],
      organizationId: 'org-1',
    };
    pg.query.mockResolvedValueOnce([
      {
        id: 'export-1',
        owner_id: 'org-1',
        status: 'ready',
        download_key: 'export/partner/org-1/export-1.csv',
      },
    ]);
    uploads.signDocumentDownload.mockResolvedValueOnce('https://r2.example.com/x');

    const result = await service.download(partnerActor, 'export-1');
    expect(result.download_url).toBe('https://r2.example.com/x');
  });
});
