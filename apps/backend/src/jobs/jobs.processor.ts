import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PostgresService } from '../infrastructure/postgres.service';
import { UploadsService } from '../uploads/uploads.service';
import { ExportDataService } from './export-data.service';
import {
  contentTypeForFormat,
  extensionForFormat,
  renderExport,
} from './export-generators';
import { WebhookDeliveryService } from './webhook-delivery.service';

interface ExportJobRow {
  id: string;
  owner_type: string;
  owner_id: string;
  type: string;
  format: string;
}

const EXPORT_JOB_NAMES = new Set([
  'user-data-export',
  'export',
  'partner-export',
]);

@Processor('safaar-background')
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private readonly pg: PostgresService,
    private readonly exportData: ExportDataService,
    private readonly uploads: UploadsService,
    private readonly webhooks: WebhookDeliveryService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (EXPORT_JOB_NAMES.has(job.name)) {
      await this.processExport(job);
      return;
    }

    if (job.name === 'partner-webhook-delivery') {
      const deliveryId = String(
        (job.data as { delivery_id?: string }).delivery_id ?? '',
      );
      if (deliveryId) {
        await this.webhooks.deliver(deliveryId);
      }
      return;
    }

    if (job.name === 'send-email') {
      // Email allaqachon navbatga qo'yilishidan OLDIN sinxron yuborilgan
      // (auth.service.ts) — bu job faqat audit yozuvi, bajarish shart emas.
      return;
    }

    this.logger.warn(`Noma'lum job turi e'tiborsiz qoldirildi: ${job.name}`);
  }

  private async processExport(job: Job): Promise<void> {
    const exportId = String((job.data as { export_id?: string }).export_id ?? '');
    if (!exportId) {
      this.logger.warn(`Export job'da export_id yo'q: ${job.name}`);
      return;
    }

    const [exportJob] = await this.pg.query<ExportJobRow>(
      `SELECT id::text, owner_type, owner_id::text, type, format
       FROM export_jobs WHERE id = $1::uuid`,
      [exportId],
    );

    if (!exportJob) {
      this.logger.warn(`Export job topilmadi: ${exportId}`);
      return;
    }

    try {
      const data = await this.exportData.resolve(
        exportJob.owner_type,
        exportJob.owner_id,
        exportJob.type,
      );
      const buffer = await renderExport(data, exportJob.format);
      const objectKey = `export/${exportJob.owner_type}/${exportJob.owner_id}/${exportId}${extensionForFormat(exportJob.format)}`;

      await this.uploads.uploadDocument(
        objectKey,
        buffer,
        contentTypeForFormat(exportJob.format),
      );

      await this.pg.query(
        `UPDATE export_jobs
         SET status = 'ready', download_key = $1, error = NULL, updated_at = $2
         WHERE id = $3::uuid`,
        [objectKey, new Date().toISOString(), exportId],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Export generatsiyasi muvaffaqiyatsiz (export_id=${exportId}): ${message}`,
      );
      await this.pg.query(
        `UPDATE export_jobs
         SET status = 'failed', error = $1, updated_at = $2
         WHERE id = $3::uuid`,
        [message.slice(0, 500), new Date().toISOString(), exportId],
      );
    }
  }
}
