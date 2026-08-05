import { BadRequestException } from '@nestjs/common';
import { Role } from '@safaar/types';
import type { PostgresService } from '../infrastructure/postgres.service';
import { UploadsService, type UploadedFile } from './uploads.service';

const actor = {
  id: '00000000-0000-2001-0000-000000000001',
  actorType: 'user' as const,
  role: Role.USER,
  roles: [Role.USER],
};

describe('UploadsService security validation', () => {
  const query = jest.fn<
    Promise<Record<string, unknown>[]>,
    [string, unknown[]?]
  >();
  const pg = {
    query,
  };

  beforeEach(() => {
    query.mockReset();
  });

  it('rejects unsafe media URL schemes before persistence', async () => {
    const service = new UploadsService(pg as unknown as PostgresService);

    await expect(
      service.create(actor, 'image', {
        mime_type: 'image/png',
        size: 1024,
        url: 'javascript:alert(1)',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(query).not.toHaveBeenCalled();
  });

  it('rejects files whose bytes do not match the declared MIME type', async () => {
    const service = new UploadsService(pg as unknown as PostgresService);
    const file: UploadedFile = {
      originalname: 'photo.png',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('not-a-real-png'),
    };

    await expect(
      service.create(actor, 'image', {}, file),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(query).not.toHaveBeenCalled();
  });

  it('allows safe absolute HTTPS media URLs', async () => {
    const service = new UploadsService(pg as unknown as PostgresService);
    query.mockResolvedValueOnce([
      {
        id: 'media-1',
        url: 'https://cdn.safaar.uz/image.png',
      },
    ]);

    await expect(
      service.create(actor, 'image', {
        mime_type: 'image/png',
        size: 1024,
        url: 'https://cdn.safaar.uz/image.png',
      }),
    ).resolves.toMatchObject({ id: 'media-1' });

    const insertParams = query.mock.calls[0]?.[1];
    expect(insertParams).toContain('https://cdn.safaar.uz/image.png');
  });
});
