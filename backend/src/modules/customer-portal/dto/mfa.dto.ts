import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class SetupMfaDto {
  @ApiPropertyOptional({ description: 'MFA secret (for verification during setup)' })
  @IsString()
  @IsNotEmpty()
  secret?: string;

  @ApiProperty({ description: 'TOTP token from authenticator app' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Token must be 6 digits' })
  token: string;
}

export class VerifyMfaDto {
  @ApiProperty({ description: 'TOTP token from authenticator app' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Token must be 6 digits' })
  token: string;
}

export class DisableMfaDto {
  @ApiProperty({ description: 'TOTP token from authenticator app to confirm disable' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Token must be 6 digits' })
  token: string;
}

