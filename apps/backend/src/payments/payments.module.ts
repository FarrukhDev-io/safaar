import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { UzumWebhookController } from './uzum-webhook.controller';
import { UzumCheckoutController } from './uzum-checkout.controller';
import { PaymentsService } from './payments.service';
import { ClickProvider } from './providers/click.provider';
import { PaymeProvider } from './providers/payme.provider';
import { UzumProvider } from './providers/uzum.provider';
import { UzumCheckoutProvider } from './providers/uzum-checkout.provider';

@Module({
  controllers: [
    PaymentsController,
    UzumWebhookController,
    UzumCheckoutController,
  ],
  providers: [
    PaymentsService,
    ClickProvider,
    PaymeProvider,
    UzumProvider,
    UzumCheckoutProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
