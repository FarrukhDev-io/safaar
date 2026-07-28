import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Role } from '@safaar/types';
import { CurrentActor, type RequestActor } from '../common/actor';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import type { UploadedFile as UploadedFilePayload } from '../uploads/uploads.service';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(Role.USER)
  create(
    @CurrentActor() actor: RequestActor | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.reviewsService.create(actor, body);
  }

  @Post('photos')
  @UseInterceptors(
    FilesInterceptor('photos', 5, { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @Roles(Role.USER)
  photos(
    @CurrentActor() actor: RequestActor | undefined,
    @UploadedFiles() files?: UploadedFilePayload[],
  ) {
    return this.reviewsService.photos(actor, files ?? []);
  }

  @Patch(':id')
  @Roles(Role.USER)
  update(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.reviewsService.update(actor, id, body);
  }

  @Delete(':id')
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  delete(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.reviewsService.delete(actor, id);
  }

  @Post(':id/reply')
  @Roles(Role.PARTNER)
  reply(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.reviewsService.reply(actor, id, body);
  }
}
