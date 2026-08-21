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
import { CreatePaymentDto } from './dto/payment.dto';

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

  // Webhook tanasi ataylab `Record<string, unknown>` — real provayderlar
  // (Click, Payme, Uzcard, Humo) o'zining maxsus maydonlarini yuboradi
  // (masalan Click'ning click_trans_id/sign_string/action kabi), va
  // global ValidationPipe'dagi `forbidNonWhitelisted` qattiq DTO klassi
  // bilan ularni butunlay rad etar edi. `ProviderWebhookDto` hujjatlash
  // (Swagger) uchun saqlanadi, lekin runtime validatsiyasida ishlatilmaydi.
  @Post('webhooks/click/prepare')
  clickPrepare(@Body() body: Record<string, unknown>) {
    return this.paymentsService.clickPrepare(body as never);
  }

  @Post('webhooks/click/complete')
  clickComplete(@Body() body: Record<string, unknown>) {
    return this.paymentsService.clickComplete(body as never);
  }

  @Post('webhooks/payme')
  payme(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.providerWebhook(
      'payme',
      'callback',
      body,
      headers,
    );
  }

  @Post('webhooks/uzcard')
  uzcard(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.providerWebhook(
      'uzcard',
      'callback',
      body,
      headers,
    );
  }

  @Post('webhooks/humo')
  humo(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.providerWebhook(
      'humo',
      'callback',
      body,
      headers,
    );
  }

  @Post('webhooks/payment/:provider')
  paymentProvider(
    @Param('provider') provider: string,
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.providerWebhook(
      provider,
      'callback',
      body,
      headers,
    );
  }
}
