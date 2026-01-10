import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber } from 'class-validator';

export enum MFAMethod {
  TOTP = 'TOTP', // Time-based One-Time Password
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  APP = 'APP', // Authenticator App
}

export enum SSOProvider {
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT',
  OKTA = 'OKTA',
  AUTH0 = 'AUTH0',
  SAML = 'SAML',
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_VERIFIED = 'MFA_VERIFIED',
  MFA_FAILED = 'MFA_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SSO_LOGIN = 'SSO_LOGIN',
  API_ACCESS = 'API_ACCESS',
}

export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class EnableMFADto {
  @ApiProperty({ description: 'MFA method', enum: MFAMethod })
  @IsEnum(MFAMethod)
  method: MFAMethod;
}

export class VerifyMFADto {
  @ApiProperty({ description: 'MFA code', example: '123456' })
  @IsString()
  code: string;
}

export class SetupSSODto {
  @ApiProperty({ description: 'SSO provider', enum: SSOProvider })
  @IsEnum(SSOProvider)
  provider: SSOProvider;

  @ApiProperty({ description: 'Provider configuration', type: Object })
  @IsObject()
  config: Record<string, any>;
}

export class SecurityAuditQueryDto {
  @ApiPropertyOptional({ description: 'User ID', example: 'user-uuid' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Event type', enum: SecurityEventType })
  @IsOptional()
  @IsEnum(SecurityEventType)
  eventType?: SecurityEventType;

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-01-31T23:59:59Z' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Limit', example: 100 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
