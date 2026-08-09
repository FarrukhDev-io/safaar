import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Role } from '@safaar/types';
import { randomUUID } from 'node:crypto';
import type { RequestActor } from '../common/actor';
import { PostgresService } from '../infrastructure/postgres.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ExportsService {
  constructor(
    private readonly pg: PostgresService,
    private readonly uploads: UploadsService,
  ) {}

  async create(ownerId: string, type: string, format: 'csv' | 'xlsx' | 'pdf') {
    const now = new Date().toISOString();
    const id = randomUUID();

    const [job] = await this.pg.query(
      `INSERT INTO export_jobs (id, owner_type, owner_id, type, format, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, 'system', ownerId, type, format, 'queued', now, now],
    );

    return job;
  }

  async findOne(actor: RequestActor | undefined, id: string) {
    return this.assertJob(actor, id);
  }

  async download(actor: RequestActor | undefined, id: string) {
    const job = await this.assertJob(actor, id);

    if (job.status === 'failed') {
      throw new UnprocessableEntityException({
        code: 'EXPORT_FAILED',
        message: job.error || 'Export yaratishda xatolik yuz berdi',
      });
    }

    if (job.status !== 'ready' || !job.download_key) {
      return { id: job.id, status: job.status, download_url: null };
    }

    const downloadUrl = await this.uploads.signDocumentDownload(
      job.download_key,
    );

    return { id: job.id, status: job.status, download_url: downloadUrl };
  }

  async delete(actor: RequestActor | undefined, id: string) {
    await this.assertJob(actor, id);
    const now = new Date().toISOString();

    const [job] = await this.pg.query(
      `UPDATE export_jobs
       SET status = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      ['deleted', now, id],
    );

    return job;
  }

  private async assertJob(actor: RequestActor | undefined, id: string) {
    const currentActor = this.requireActor(actor);

    const [job] = await this.pg.query(
      'SELECT * FROM export_jobs WHERE id = $1',
      [id],
    );

    if (!job) {
      throw new NotFoundException({
        code: 'EXPORT_NOT_READY',
        message: 'Export hali tayyor emas',
      });
    }

    const isOwner =
      job.owner_id === currentActor.id ||
      // Hamkor (partner) actor'lar uchun export egasi shaxsiy
      // foydalanuvchi ID'i emas, balki tashkilot ID'i sifatida
      // yoziladi (`createExport` — `owner_id = organizationId`).
      (currentActor.actorType === 'partner' &&
        currentActor.organizationId !== undefined &&
        job.owner_id === currentActor.organizationId);

    if (
      currentActor.role !== Role.SUPER_ADMIN &&
      currentActor.actorType !== 'admin' &&
      !isOwner
    ) {
      throw new ForbiddenException({
        code: 'EXPORT_FORBIDDEN',
        message: 'Bu export sizga tegishli emas',
      });
    }

    return job;
  }

  private requireActor(actor: RequestActor | undefined): RequestActor {
    if (!actor) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Sessiya topilmadi yoki token yaroqsiz',
      });
    }
    return actor;
  }
}
