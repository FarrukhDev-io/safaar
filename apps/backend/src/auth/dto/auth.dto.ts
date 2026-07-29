import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class SendEmailOtpDto {
  @ApiProperty({ example: 'user@uzbron.uz' })
  @IsEmail()
  email!: string;
}

export class VerifyEmailOtpRequestDto extends SendEmailOtpDto {
  @ApiPropertyOptional({ example: 'otp-challenge-id' })
  @IsOptional()
  @IsString()
  challenge_id?: string;

  @ApiProperty({ example: '482913' })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class VerifyOtpRequestDto extends SendOtpDto {
  @ApiPropertyOptional({ example: 'otp-challenge-id' })
  @IsOptional()
  @IsString()
  challenge_id?: string;

  @ApiPropertyOptional({ example: 'challenge-id' })
  @IsOptional()
  @IsString()
  chalenge_id?: string;

  @ApiProperty({ example: '482913' })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class CompleteProfileDto {
  @ApiPropertyOptional({ example: 'Laziz' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ example: 'Shakarov' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'user@uzbron.uz' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'P@ssw0rd!' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ enum: ['uz', 'ru', 'en'] })
  @IsOptional()
  @IsIn(['uz', 'ru', 'en'])
  preferred_language?: 'uz' | 'ru' | 'en';
}

export class OAuthTokenDto {
  @ApiPropertyOptional({ example: 'google-user-id' })
  @IsOptional()
  @IsString()
  provider_user_id?: string;

  @ApiPropertyOptional({ example: 'user@gmail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class OAuthExchangeDto {
  @ApiProperty({ example: 'one-time-oauth-code' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'partner@uzbron.uz' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class UserLoginDto {
  @ApiProperty({ example: 'user@uzbron.uz' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class UserForgotPasswordDto {
  @ApiProperty({ example: 'user@uzbron.uz' })
  @IsEmail()
  email!: string;
}

export class UserVerifyResetCodeDto extends VerifyEmailOtpRequestDto {}

export class UserResetPasswordDto {
  @ApiProperty({ example: 'user@uzbron.uz' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '482913' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  code?: string;

  @ApiPropertyOptional({ example: 'otp-challenge-id' })
  @IsOptional()
  @IsString()
  challenge_id?: string;

  @ApiPropertyOptional({ example: 'one-time-reset-token' })
  @IsOptional()
  @IsString()
  reset_token?: string;

  @ApiProperty({ example: 'N3wP@ssw0rd!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class AdminLoginDto {
  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiPropertyOptional({ example: 'admin@uzbron.uz' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'partner@uzbron.uz' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class Verify2faDto {
  @ApiPropertyOptional({ example: 'challenge-id' })
  @IsOptional()
  @IsString()
  challenge_id?: string;

  @ApiProperty({ example: '482913' })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  refresh_token?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class TotpSetupConfirmDto {
  @ApiProperty({ example: 'setup-id' })
  @IsString()
  @IsNotEmpty()
  setup_id!: string;

  @ApiProperty({ example: '482913' })
  @IsString()
  @Length(6, 6)
  code!: string;
}
