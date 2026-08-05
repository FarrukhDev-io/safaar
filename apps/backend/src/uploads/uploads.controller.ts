import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@safaar/types';
import { CurrentActor, type RequestActor } from '../common/actor';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import {
  UploadsService,
  type UploadedFile as UploadedFilePayload,
} from './uploads.service';

@Controller('uploads')
@UseGuards(RolesGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  image(
    @CurrentActor() actor: RequestActor | undefined,
    @Body() body: Record<string, unknown>,
    @UploadedFile() file?: UploadedFilePayload,
  ) {
    return this.uploadsService.create(actor, 'image', body, file);
  }

  @Post('documents')
  @Roles(Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  document(
    @CurrentActor() actor: RequestActor | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.uploadsService.create(actor, 'document', body);
  }

  @Post('presign')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  presign(
    @CurrentActor() actor: RequestActor | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.uploadsService.presign(actor, body);
  }

  @Delete(':id')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  delete(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.uploadsService.delete(actor, id);
  }

  @Get(':id/download')
  @Roles(Role.USER, Role.PARTNER, Role.ADMIN, Role.SUPER_ADMIN)
  download(
    @CurrentActor() actor: RequestActor | undefined,
    @Param('id') id: string,
  ) {
    return this.uploadsService.download(actor, id);
  }
}
