import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsArray } from 'class-validator';

export enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

export enum EventPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum HandlerType {
  WEBHOOK = 'WEBHOOK',
  FUNCTION = 'FUNCTION',
  QUEUE = 'QUEUE',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export class PublishEventDto {
  @ApiProperty({ description: 'Event name', example: 'loan.application.approved' })
  @IsString()
  eventName: string;

  @ApiProperty({ description: 'Event data', type: Object })
  @IsObject()
  eventData: Record<string, any>;

  @ApiPropertyOptional({ description: 'Event priority', enum: EventPriority, example: EventPriority.NORMAL })
  @IsOptional()
  @IsEnum(EventPriority)
  priority?: EventPriority;

  @ApiPropertyOptional({ description: 'Correlation ID', example: 'corr-123' })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional({ description: 'Source service', example: 'loan-service' })
  @IsOptional()
  @IsString()
  source?: string;
}

export class SubscribeToEventDto {
  @ApiProperty({ description: 'Event name pattern', example: 'loan.*' })
  @IsString()
  eventPattern: string;

  @ApiProperty({ description: 'Handler type', enum: HandlerType })
  @IsEnum(HandlerType)
  handlerType: HandlerType;

  @ApiProperty({ description: 'Handler configuration', type: Object })
  @IsObject()
  handlerConfig: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class Event {
  @ApiProperty({ description: 'Event ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Event name', example: 'loan.application.approved' })
  eventName: string;

  @ApiProperty({ description: 'Event data', type: Object })
  eventData: Record<string, any>;

  @ApiProperty({ description: 'Status', enum: EventStatus })
  status: EventStatus;

  @ApiProperty({ description: 'Priority', enum: EventPriority })
  priority: EventPriority;

  @ApiProperty({ description: 'Published date', example: '2024-01-15T00:00:00Z' })
  publishedAt: Date;

  @ApiProperty({ description: 'Processed date', example: '2024-01-15T00:00:01Z' })
  processedAt?: Date;
}

export class EventSubscription {
  @ApiProperty({ description: 'Subscription ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Event pattern', example: 'loan.*' })
  eventPattern: string;

  @ApiProperty({ description: 'Handler type', enum: HandlerType })
  handlerType: HandlerType;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Processed count', example: 1250 })
  processedCount: number;

  @ApiProperty({ description: 'Failed count', example: 5 })
  failedCount: number;
}

export class EventReplayDto {
  @ApiProperty({ description: 'Event name pattern', example: 'loan.*' })
  @IsString()
  eventPattern: string;

  @ApiProperty({ description: 'Start date (ISO format)', example: '2024-01-01T00:00:00Z' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: 'End date (ISO format)', example: '2024-01-31T23:59:59Z' })
  @IsString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Subscription IDs to replay', type: [String] })
  @IsOptional()
  @IsArray()
  subscriptionIds?: string[];
}

