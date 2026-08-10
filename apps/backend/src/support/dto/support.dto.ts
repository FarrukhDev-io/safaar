import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupportTicketDto {
  @ApiProperty({ example: 'Bron uchun to‘lov o‘tmadi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'] })
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export class CreateSupportMessageDto {
  @ApiProperty({ example: 'Xabar matni' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string;
}
