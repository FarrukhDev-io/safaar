import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@safaar/types';
import { CurrentActor, type RequestActor } from '../common/actor';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(RolesGuard)
@Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentActor() actor: RequestActor | undefined,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.notificationsService.list(actor, query);
  }

  @Patch(':id/read')
  read(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.notificationsService.read(actor, id);
  }

  @Patch('read-all')
  readAll(@CurrentActor() actor: RequestActor | undefined) {
    return this.notificationsService.readAll(actor);
  }

  @Post('push-tokens')
  pushToken(
    @CurrentActor() actor: RequestActor | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.notificationsService.pushToken(actor, body);
  }

  @Delete('push-tokens/:id')
  deletePushToken(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.notificationsService.deletePushToken(actor, id);
  }
}
