import { IsDateString, IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditEventType, AuditEntityType } from '../entities/audit-log.entity';

export class QueryAuditLogsDto {
  @ApiPropertyOptional({ description: 'User ID filter' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Event type filter',
    enum: AuditEventType,
  })
  @IsEnum(AuditEventType)
  @IsOptional()
  eventType?: AuditEventType;

  @ApiPropertyOptional({
    description: 'Entity type filter',
    enum: AuditEntityType,
  })
  @IsEnum(AuditEntityType)
  @IsOptional()
  entityType?: AuditEntityType;

  @ApiPropertyOptional({ description: 'Entity ID filter' })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ description: 'From date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ description: 'IP address filter' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 50 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

