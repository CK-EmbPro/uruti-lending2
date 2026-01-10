import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsBoolean, IsArray } from 'class-validator';

export enum IntegrationType {
  PAYMENT_GATEWAY = 'PAYMENT_GATEWAY',
  ACCOUNTING = 'ACCOUNTING',
  CRM = 'CRM',
  DOCUMENT_STORAGE = 'DOCUMENT_STORAGE',
  EMAIL_SERVICE = 'EMAIL_SERVICE',
  SMS_SERVICE = 'SMS_SERVICE',
  CREDIT_BUREAU = 'CREDIT_BUREAU',
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  BANKING = 'BANKING',
  ANALYTICS = 'ANALYTICS',
}

export enum IntegrationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CONFIGURING = 'CONFIGURING',
  ERROR = 'ERROR',
}

export class CreateIntegrationDto {
  @ApiProperty({ description: 'Integration name', example: 'Stripe Payment Gateway' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Integration type', enum: IntegrationType })
  @IsEnum(IntegrationType)
  type: IntegrationType;

  @ApiProperty({ description: 'Provider name', example: 'Stripe' })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'Configuration', type: Object })
  @IsObject()
  configuration: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class IntegrationResult {
  @ApiProperty({ description: 'Integration ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Integration name', example: 'Stripe Payment Gateway' })
  name: string;

  @ApiProperty({ description: 'Integration type', enum: IntegrationType })
  type: IntegrationType;

  @ApiProperty({ description: 'Provider name', example: 'Stripe' })
  provider: string;

  @ApiProperty({ description: 'Status', enum: IntegrationStatus })
  status: IntegrationStatus;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last synced at', example: '2024-01-15T10:30:00Z' })
  lastSyncedAt?: string;

  @ApiProperty({ description: 'Error count', example: 0 })
  errorCount: number;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;
}

export class TestIntegrationDto {
  @ApiProperty({ description: 'Integration ID', example: 'uuid' })
  @IsString()
  integrationId: string;

  @ApiPropertyOptional({ description: 'Test operation', example: 'CONNECTION_TEST' })
  @IsOptional()
  @IsString()
  testOperation?: string;
}

export class IntegrationTestResult {
  @ApiProperty({ description: 'Test status', example: 'SUCCESS', enum: ['SUCCESS', 'FAILED'] })
  status: string;

  @ApiProperty({ description: 'Test message', example: 'Connection successful' })
  message: string;

  @ApiProperty({ description: 'Response time (ms)', example: 150 })
  responseTimeMs: number;

  @ApiProperty({ description: 'Test details', type: Object })
  details: Record<string, any>;
}

export class AvailableIntegrations {
  @ApiProperty({ description: 'Available integrations', type: [Object] })
  integrations: Array<{
    type: IntegrationType;
    provider: string;
    name: string;
    description: string;
    features: string[];
    requiresConfiguration: boolean;
  }>;
}

