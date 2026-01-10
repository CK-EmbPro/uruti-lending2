import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, IsUrl, IsEmail, IsEnum } from 'class-validator';
import { PlatformStatus } from '../entities/third-party-platform.entity';

export class CreateThirdPartyPlatformDto {
  @ApiProperty({ description: 'Unique platform code (e.g., URUTIX, CARGO-MATCH)', example: 'URUTIX' })
  @IsString()
  @IsNotEmpty()
  platformCode: string;

  @ApiProperty({ description: 'Platform display name', example: 'UrutiX Platform' })
  @IsString()
  @IsNotEmpty()
  platformName: string;

  @ApiPropertyOptional({ description: 'Platform description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Platform status', enum: PlatformStatus, default: PlatformStatus.ACTIVE })
  @IsEnum(PlatformStatus)
  @IsOptional()
  status?: PlatformStatus;

  @ApiPropertyOptional({ description: 'Webhook URL for notifications', example: 'https://platform.com/webhooks/lending' })
  @IsUrl()
  @IsOptional()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Webhook secret for signature verification' })
  @IsString()
  @IsOptional()
  webhookSecret?: string;

  @ApiPropertyOptional({ description: 'Can create customers', default: true })
  @IsBoolean()
  @IsOptional()
  canCreateCustomers?: boolean;

  @ApiPropertyOptional({ description: 'Can create loan applications', default: true })
  @IsBoolean()
  @IsOptional()
  canCreateApplications?: boolean;

  @ApiPropertyOptional({ description: 'Can post repayments', default: true })
  @IsBoolean()
  @IsOptional()
  canPostRepayments?: boolean;

  @ApiPropertyOptional({ description: 'Can query loan status', default: true })
  @IsBoolean()
  @IsOptional()
  canQueryLoanStatus?: boolean;

  @ApiPropertyOptional({ description: 'Rate limit per minute', default: 1000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  rateLimitPerMinute?: number;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)' })
  @IsOptional()
  metadata?: Record<string, any>;
}

