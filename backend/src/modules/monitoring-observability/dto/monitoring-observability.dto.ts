import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsObject } from 'class-validator';

export enum MetricType {
  COUNTER = 'COUNTER',
  GAUGE = 'GAUGE',
  HISTOGRAM = 'HISTOGRAM',
  SUMMARY = 'SUMMARY',
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export class CreateMetricDto {
  @ApiProperty({ description: 'Metric name', example: 'api.request.count' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Metric type', enum: MetricType })
  @IsEnum(MetricType)
  type: MetricType;

  @ApiProperty({ description: 'Metric value', example: 100 })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ description: 'Labels', type: Object })
  @IsOptional()
  @IsObject()
  labels?: Record<string, string>;
}

export class CreateAlertRuleDto {
  @ApiProperty({ description: 'Rule name', example: 'High Error Rate' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Metric name', example: 'api.error.rate' })
  @IsString()
  metricName: string;

  @ApiProperty({ description: 'Threshold', example: 0.05 })
  @IsNumber()
  threshold: number;

  @ApiProperty({ description: 'Severity', enum: AlertSeverity })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiPropertyOptional({ description: 'Condition', example: 'greater_than' })
  @IsOptional()
  @IsString()
  condition?: string;
}

