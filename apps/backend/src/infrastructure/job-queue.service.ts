import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';

export type RedisConnectionOptions = {
  host: string;
  port: number;
  db?: number;
  username?: string;
  password?: string;
  maxRetriesPerRequest: null;
};

export interface QueueJob<TPayload = Record<string, unknown>> {
  id: string;
  name: string;
  payload: TPayload;
  status: 'queued';
  created_at: string;
}

export interface AddJobOptions {
  idempotencyKey?: string;
  delayMs?: number;
}

@Injectable()
export class JobQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);
  private readonly memoryJobs = new Map<string, QueueJob>();
  private readonly queue?: Queue;

  constructor(config: ConfigService) {
    const redisUrl =
      config.get<string>('QUEUE_REDIS_URL') ?? config.get<string>('REDIS_URL');

    if (redisUrl) {
      this.queue = new Queue('safaar-background', {
        connection: redisConnection(redisUrl),
      });
    }
  }

  async add<TPayload extends Record<string, unknown>>(
    name: string,
    payload: TPayload,
    options: AddJobOptions = {},
  ): Promise<QueueJob<TPayload>> {
    const id = options.idempotencyKey ?? randomUUID();
    const existing = this.memoryJobs.get(id) as QueueJob<TPayload> | undefined;
    if (existing) {
      return existing;
    }

    const job: QueueJob<TPayload> = {
      id,
      name,
      payload,
      status: 'queued',
      created_at: new Date().toISOString(),
    };

    this.memoryJobs.set(id, job);
    await this.addToBullMq(job, options);
    return job;
  }

  private async addToBullMq(
    job: QueueJob,
    options: AddJobOptions,
  ): Promise<void> {
    if (!this.queue) {
      return;
    }

    try {
      // BullMQ'ning custom jobId'sida ":" belgisiga ruxsat berilmaydi
      // ("Custom Id cannot contain :"), lekin butun kod bo'ylab
      // idempotencyKey'lar ":" bilan qurilgan (masalan
      // `partner-export:${orgId}:${type}:${format}`) — shu sabab bu
      // yerda BullMQ'ga yuborishdan oldin xavfsiz belgiga almashtiriladi.
      // `job.id`ning o'zi (memoryJobs xaritasidagi idempotentlik kaliti)
      // o'zgarishsiz qoladi.
      await this.queue.add(job.name, job.payload, {
        jobId: job.id.replace(/:/g, '_'),
        delay: options.delayMs,
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'queue_enqueue_failed',
          job_name: job.name,
          job_id: job.id,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  async onModuleDestroy() {
    await this.queue?.close();
  }
}

export function redisConnection(redisUrl: string): RedisConnectionOptions {
  const parsed = new URL(redisUrl);
  const database = Number(parsed.pathname.replace('/', ''));

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    db: Number.isInteger(database) ? database : undefined,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    maxRetriesPerRequest: null,
  };
}
