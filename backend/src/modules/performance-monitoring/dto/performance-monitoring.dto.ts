import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max } from 'class-validator';

export enum MetricType {
  API_RESPONSE_TIME = 'API_RESPONSE_TIME',
  API_ERROR_RATE = 'API_ERROR_RATE',
  DATABASE_QUERY_TIME = 'DATABASE_QUERY_TIME',
  MEMORY_USAGE = 'MEMORY_USAGE',
  CPU_USAGE = 'CPU_USAGE',
  ACTIVE_CONNECTIONS = 'ACTIVE_CONNECTIONS',
  REQUEST_COUNT = 'REQUEST_COUNT',
  CACHE_HIT_RATE = 'CACHE_HIT_RATE',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class GetPerformanceMetricsDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Metric type', enum: MetricType })
  @IsOptional()
  @IsEnum(MetricType)
  metricType?: MetricType;

  @ApiPropertyOptional({ description: 'Endpoint filter', example: '/api/loans' })
  @IsOptional()
  @IsString()
  endpoint?: string;
}

export class PerformanceMetricsResult {
  @ApiProperty({ description: 'Metrics', type: [Object] })
  metrics: Array<{
    timestamp: string;
    type: MetricType;
    value: number;
    endpoint?: string;
    metadata?: Record<string, any>;
  }>;

  @ApiProperty({ description: 'Summary statistics', type: Object })
  summary: {
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
    count: number;
  };

  @ApiProperty({ description: 'Alerts', type: [Object] })
  alerts: Array<{
    id: string;
    severity: AlertSeverity;
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

export class CreateAlertRuleDto {
  @ApiProperty({ description: 'Rule name', example: 'High API Response Time' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Metric type', enum: MetricType })
  @IsEnum(MetricType)
  metricType: MetricType;

  @ApiProperty({ description: 'Threshold value', example: 1000 })
  @IsNumber()
  threshold: number;

  @ApiProperty({ description: 'Operator', example: '>', enum: ['>', '<', '>=', '<=', '=='] })
  @IsString()
  operator: string;

  @ApiProperty({ description: 'Severity', enum: AlertSeverity })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiPropertyOptional({ description: 'Endpoint filter', example: '/api/loans' })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  isActive?: boolean;
}

export class SystemHealth {
  @ApiProperty({ description: 'Overall health status', example: 'HEALTHY', enum: ['HEALTHY', 'DEGRADED', 'UNHEALTHY'] })
  status: string;

  @ApiProperty({ description: 'Health score (0-100)', example: 95 })
  healthScore: number;

  @ApiProperty({ description: 'Component health', type: Object })
  components: {
    database: { status: string; responseTime: number };
    api: { status: string; averageResponseTime: number };
    cache: { status: string; hitRate: number };
    storage: { status: string; usage: number };
  };

  @ApiProperty({ description: 'Active alerts', example: 2 })
  activeAlerts: number;

  @ApiProperty({ description: 'Uptime percentage', example: 99.9 })
  uptime: number;
}

