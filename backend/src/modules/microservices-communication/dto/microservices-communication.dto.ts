import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsNumber, IsBoolean } from 'class-validator';

export enum ServiceType {
  HTTP = 'HTTP',
  GRPC = 'GRPC',
  MESSAGE_QUEUE = 'MESSAGE_QUEUE',
  WEBSOCKET = 'WEBSOCKET',
}

export enum CommunicationPattern {
  REQUEST_RESPONSE = 'REQUEST_RESPONSE',
  PUBLISH_SUBSCRIBE = 'PUBLISH_SUBSCRIBE',
  REQUEST_STREAM = 'REQUEST_STREAM',
  EVENT_DRIVEN = 'EVENT_DRIVEN',
}

export enum ServiceStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
  UNKNOWN = 'UNKNOWN',
}

export class ServiceCallDto {
  @ApiProperty({ description: 'Service name', example: 'loan-service' })
  @IsString()
  serviceName: string;

  @ApiProperty({ description: 'Endpoint', example: '/loans/:id' })
  @IsString()
  endpoint: string;

  @ApiProperty({ description: 'HTTP method', example: 'GET' })
  @IsString()
  method: string;

  @ApiPropertyOptional({ description: 'Request data', type: Object })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Timeout (ms)', example: 5000 })
  @IsOptional()
  @IsNumber()
  timeout?: number;
}

export class ServiceRegistrationDto {
  @ApiProperty({ description: 'Service name', example: 'loan-service' })
  @IsString()
  serviceName: string;

  @ApiProperty({ description: 'Service URL', example: 'http://loan-service:3000' })
  @IsString()
  serviceUrl: string;

  @ApiProperty({ description: 'Service type', enum: ServiceType })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional({ description: 'Health check endpoint', example: '/health' })
  @IsOptional()
  @IsString()
  healthCheckEndpoint?: string;

  @ApiPropertyOptional({ description: 'Metadata', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ServiceHealth {
  @ApiProperty({ description: 'Service name' })
  serviceName: string;

  @ApiProperty({ description: 'Status', enum: ServiceStatus })
  status: ServiceStatus;

  @ApiProperty({ description: 'Response time (ms)', example: 45 })
  responseTime: number;

  @ApiProperty({ description: 'Last checked', example: '2024-01-15T00:00:00Z' })
  lastChecked: Date;
}

