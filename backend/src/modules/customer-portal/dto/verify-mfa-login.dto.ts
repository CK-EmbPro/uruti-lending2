import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyMfaLoginDto {
  @ApiProperty({ description: 'Temporary login token from initial login' })
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @ApiProperty({ description: 'TOTP token from authenticator app' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Token must be 6 digits' })
  token: string;
}

