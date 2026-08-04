import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@safaar/types';
import { CurrentActor, type RequestActor } from '../common/actor';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { BookingsService } from './bookings.service';
import {
  CancelBookingDto,
  CreateBusBookingDto,
  CreateHotelBookingDto,
  SendBookingMessageDto,
} from './dto/booking.dto';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('hotel')
  @Roles(Role.USER)
  createHotel(
    @CurrentActor() actor: RequestActor | undefined,
    @Body() dto: CreateHotelBookingDto,
  ) {
    return this.bookingsService.createHotel(
      actor,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('bus')
  @Roles(Role.USER)
  createBus(
    @CurrentActor() actor: RequestActor | undefined,
    @Body() dto: CreateBusBookingDto,
  ) {
    return this.bookingsService.createBus(
      actor,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get(':id')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  findOne(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.bookingsService.findOne(actor, id);
  }

  @Post(':id/retry-payment')
  @Roles(Role.USER)
  retryPayment(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.bookingsService.retryPayment(actor, id);
  }

  @Post(':id/cancel-preview')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  cancelPreview(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.bookingsService.cancelPreview(actor, id);
  }

  @Post(':id/cancel')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  cancel(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
    @Body() body: CancelBookingDto,
  ) {
    return this.bookingsService.cancel(
      actor,
      id,
      body as unknown as Record<string, unknown>,
    );
  }

  @Get(':id/voucher')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  voucher(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.bookingsService.voucher(actor, id);
  }

  @Get(':id/status-history')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  statusHistory(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.bookingsService.statusHistory(actor, id);
  }

  @Get(':id/conversation')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  conversation(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.bookingsService.conversation(actor, id);
  }

  @Get(':id/messages')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  messages(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.bookingsService.messages(actor, id);
  }

  @Post(':id/messages')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  sendMessage(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
    @Body() body: SendBookingMessageDto,
  ) {
    return this.bookingsService.sendMessage(
      actor,
      id,
      body as unknown as Record<string, unknown>,
    );
  }

  @Post(':id/messages/:messageId/read')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  readMessage(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return this.bookingsService.readMessage(actor, id, messageId);
  }
}
