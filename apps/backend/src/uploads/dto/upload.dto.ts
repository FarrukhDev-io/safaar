import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateMediaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  // Multipart/form-data (fayl yuklashda) qiymat har doim string sifatida
  // keladi, JSON (faqat URL rejimida) esa raqam sifatida — shu sabab
  // qat'iy tip talab qilinmaydi, xizmat qatlamida Number(...) orqali
  // baribir xavfsiz o'qiladi.
  @ApiPropertyOptional()
  @IsOptional()
  size?: number | string;

  @ApiPropertyOptional({
    description:
      'Fayl o‘rniga tayyor URL (masalan tashqi CMS orqali yuklangan)',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description:
      'Asl fayl nomi yoki tavsif (masalan hujjat ro‘yxatida ko‘rsatish uchun)',
  })
  @IsOptional()
  @IsString()
  caption?: string;
}

export class PresignUploadDto {
  @ApiPropertyOptional({ enum: ['image', 'document'] })
  @IsOptional()
  @IsIn(['image', 'document'])
  type?: 'image' | 'document';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  size?: number | string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  filename?: string;
}
