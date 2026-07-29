import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@safaar/types';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { PromosService } from './promos.service';

@Controller('promos')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  /** Hozir amal qiladigan promo-kodlar — ochiq, avtorizatsiyasiz. */
  @Get()
  active() {
    return this.promosService.active();
  }

  @Post('validate')
  @UseGuards(RolesGuard)
  @Roles(Role.USER)
  validate(@Body() body: Record<string, unknown>) {
    return this.promosService.validate(body);
  }
}
