import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@safaar/types';
import { CurrentActor, type RequestActor } from '../common/actor';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, ProviderWebhookDto } from './dto/payment.dto';

@ApiTags('payments')
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payments/:bookingId')
  @UseGuards(RolesGuard)
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  payment(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('bookingId') bookingId: string,
  ) {
    return this.paymentsService.payment(actor, bookingId);
  }

  @Post('payments/:bookingId/create')
  @UseGuards(RolesGuard)
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  createPayment(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('bookingId') bookingId: string,
    @Body() body: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(
      actor,
      bookingId,
      body as unknown as Record<string, unknown>,
    );
  }

  @Post('webhooks/click/prepare')
  clickPrepare(
    @Body() body: ProviderWebhookDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.providerWebhook(
      'click',
      'prepare',
      body as unknown as Record<string, unknown>,
      headers,
    );
  }

  @Post('webhooks/click/complete')
  clickComplete(
    @Body() body: ProviderWebhookDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.providerWebhook(
      'click',
      'complete',
      body as unknown as Record<string, unknown>,
      headers,
    );
  }

  @Post('webhooks/payme')
  payme(
    @Body() body: ProviderWebhookDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.providerWebhook(
      'payme',
      'callback',
      body as unknown as Record<string, unknown>,
      headers,
    );
  }

  @Post('webhooks/uzcard')
  uzcard(
    @Body() body: ProviderWebhookDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.providerWebhook(
      'uzcard',
      'callback',
      body as unknown as Record<string, unknown>,
      headers,
    );
  }

  @Post('webhooks/humo')
  humo(
    @Body() body: ProviderWebhookDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.providerWebhook(
      'humo',
      'callback',
      body as unknown as Record<string, unknown>,
      headers,
    );
  }

  @Post('webhooks/payment/:provider')
  paymentProvider(
    @Param('provider') provider: string,
    @Body() body: ProviderWebhookDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.providerWebhook(
      provider,
      'callback',
      body as unknown as Record<string, unknown>,
      headers,
    );
  }
}
