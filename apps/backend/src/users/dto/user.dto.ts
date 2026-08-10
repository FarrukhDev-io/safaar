import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Laziz' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Shakarov' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({ example: 'user@safaar.uz' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class SetAvatarDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  media_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaId?: string;
}
