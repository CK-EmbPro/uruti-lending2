import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, Min, Max } from 'class-validator';

export enum APIKeyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum WebhookEvent {
  LOAN_APPLICATION_CREATED = 'LOAN_APPLICATION_CREATED',
  LOAN_APPLICATION_APPROVED = 'LOAN_APPLICATION_APPROVED',
  LOAN_APPLICATION_REJECTED = 'LOAN_APPLICATION_REJECTED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  LOAN_CLOSED = 'LOAN_CLOSED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_MISSED = 'PAYMENT_MISSED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
}

export enum WebhookStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FAILING = 'FAILING',
}

export class CreateAPIKeyDto {
  @ApiProperty({ description: 'API key name', example: 'Production API Key' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'API key for production integration' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Expiry date (ISO format)', example: '2025-12-31' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Rate limit (requests per minute)', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  rateLimit?: number;

  @ApiPropertyOptional({ description: 'Allowed IP addresses', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedIPs?: string[];
}

export class APIKeyResult {
  @ApiProperty({ description: 'API key ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'API key name', example: 'Production API Key' })
  name: string;

  @ApiProperty({ description: 'API key (only shown on creation)', example: 'sk_live_...' })
  apiKey?: string;

  @ApiProperty({ description: 'Status', enum: APIKeyStatus })
  status: APIKeyStatus;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last used at', example: '2024-01-15T10:30:00Z' })
  lastUsedAt?: string;

  @ApiProperty({ description: 'Usage count', example: 1500 })
  usageCount: number;
}

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook URL', example: 'https://example.com/webhook' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Webhook name', example: 'Loan Status Updates' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Events to subscribe to', type: [String], enum: WebhookEvent })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @ApiPropertyOptional({ description: 'Secret for signature verification', example: 'webhook-secret' })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class WebhookResult {
  @ApiProperty({ description: 'Webhook ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Webhook URL', example: 'https://example.com/webhook' })
  url: string;

  @ApiProperty({ description: 'Webhook name', example: 'Loan Status Updates' })
  name: string;

  @ApiProperty({ description: 'Events', type: [String] })
  events: WebhookEvent[];

  @ApiProperty({ description: 'Status', enum: WebhookStatus })
  status: WebhookStatus;

  @ApiProperty({ description: 'Total deliveries', example: 150 })
  totalDeliveries: number;

  @ApiProperty({ description: 'Successful deliveries', example: 145 })
  successfulDeliveries: number;

  @ApiProperty({ description: 'Failed deliveries', example: 5 })
  failedDeliveries: number;

  @ApiProperty({ description: 'Last delivery at', example: '2024-01-15T10:30:00Z' })
  lastDeliveryAt?: string;
}

export class WebhookDelivery {
  @ApiProperty({ description: 'Delivery ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Webhook ID', example: 'uuid' })
  webhookId: string;

  @ApiProperty({ description: 'Event type', example: 'LOAN_APPLICATION_APPROVED' })
  event: string;

  @ApiProperty({ description: 'Status', example: 'SUCCESS', enum: ['SUCCESS', 'FAILED', 'PENDING'] })
  status: string;

  @ApiProperty({ description: 'Response code', example: 200 })
  responseCode?: number;

  @ApiProperty({ description: 'Response time (ms)', example: 150 })
  responseTimeMs?: number;

  @ApiProperty({ description: 'Error message', example: null })
  errorMessage?: string;

  @ApiProperty({ description: 'Delivered at', example: '2024-01-15T10:30:00Z' })
  deliveredAt: string;
}

export class APIUsageStats {
  @ApiProperty({ description: 'Total API calls', example: 10000 })
  totalCalls: number;

  @ApiProperty({ description: 'Successful calls', example: 9800 })
  successfulCalls: number;

  @ApiProperty({ description: 'Failed calls', example: 200 })
  failedCalls: number;

  @ApiProperty({ description: 'Average response time (ms)', example: 120 })
  averageResponseTime: number;

  @ApiProperty({ description: 'Usage by endpoint', type: Object })
  usageByEndpoint: Record<string, number>;

  @ApiProperty({ description: 'Usage over time', type: [Object] })
  usageOverTime: Array<{
    date: string;
    calls: number;
    success: number;
    failed: number;
  }>;
}

