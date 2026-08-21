import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@safaar/types';
import { CurrentActor, type RequestActor } from '../common/actor';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { RefundsService } from './refunds.service';

@Controller()
@UseGuards(RolesGuard)
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post('refunds')
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  create(
    @CurrentActor() actor: RequestActor | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.refundsService.create(actor, body);
  }

  @Get('refunds/:id')
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  findOne(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.refundsService.findOne(actor, id);
  }

  @Get('me/refunds')
  @Roles(Role.USER)
  mine(@CurrentActor() actor: RequestActor | undefined) {
    return this.refundsService.mine(actor);
  }
}
