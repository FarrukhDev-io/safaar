import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { UzumWebhookController } from './uzum-webhook.controller';
import { PaymentsService } from './payments.service';
import { ClickProvider } from './providers/click.provider';
import { PaymeProvider } from './providers/payme.provider';
import { UzumProvider } from './providers/uzum.provider';

@Module({
  controllers: [PaymentsController, UzumWebhookController],
  providers: [PaymentsService, ClickProvider, PaymeProvider, UzumProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
