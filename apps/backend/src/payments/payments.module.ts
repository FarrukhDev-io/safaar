import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ClickProvider } from './providers/click.provider';
import { PaymeProvider } from './providers/payme.provider';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, ClickProvider, PaymeProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
