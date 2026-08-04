import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateHotelBookingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hotel_id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  room_id!: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsString()
  check_in!: string;

  @ApiProperty({ example: '2026-07-03' })
  @IsString()
  check_out!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  rooms?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  adults?: number;

  @ApiPropertyOptional({
    default: 'click',
    enum: ['click', 'payme', 'uzcard', 'humo', 'cash'],
  })
  @IsOptional()
  @IsIn(['click', 'payme', 'uzcard', 'humo', 'cash'])
  payment_method?: string;

  @ApiPropertyOptional({
    default: 'instant_confirmation',
    enum: ['instant_confirmation', 'request_confirmation'],
  })
  @IsOptional()
  @IsIn(['instant_confirmation', 'request_confirmation'])
  confirmation_mode?: string;

  @ApiPropertyOptional({ example: 'Laziz Shakarov' })
  @IsOptional()
  @IsString()
  guest_name?: string;

  @ApiPropertyOptional({ example: 'laziz@example.com' })
  @IsOptional()
  @IsString()
  guest_email?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @IsString()
  guest_phone?: string;
}

export class CreateBusBookingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  trip_id!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  seats!: string[];

  @ApiPropertyOptional({
    default: 'click',
    enum: ['click', 'payme', 'uzcard', 'humo', 'cash'],
  })
  @IsOptional()
  @IsIn(['click', 'payme', 'uzcard', 'humo', 'cash'])
  payment_method?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SendBookingMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body!: string;
}
