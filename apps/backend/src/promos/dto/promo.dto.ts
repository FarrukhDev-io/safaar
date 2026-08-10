import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ValidatePromoDto {
  @ApiProperty({ example: 'SAFAAR10' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code!: string;
}
