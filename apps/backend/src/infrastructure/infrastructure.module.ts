import { Global, Module } from '@nestjs/common';
import { AppCacheService } from './cache.service';
import { EmailService } from './email.service';
import { JobQueueService } from './job-queue.service';
import { PostgresService } from './postgres.service';
import { SmsService } from './sms.service';

@Global()
@Module({
  providers: [
    AppCacheService,
    EmailService,
    JobQueueService,
    PostgresService,
    SmsService,
  ],
  exports: [
    AppCacheService,
    EmailService,
    JobQueueService,
    PostgresService,
    SmsService,
  ],
})
export class InfrastructureModule {}
