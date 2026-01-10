import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max } from 'class-validator';

export enum AnalyticsType {
  COHORT = 'COHORT',
  FUNNEL = 'FUNNEL',
  RETENTION = 'RETENTION',
  SEGMENTATION = 'SEGMENTATION',
  CONVERSION = 'CONVERSION',
}

export class CohortAnalysisDto {
  @ApiProperty({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Cohort type', example: 'MONTHLY', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'] })
  @IsOptional()
  @IsString()
  cohortType?: string;

  @ApiPropertyOptional({ description: 'Metric to analyze', example: 'REVENUE', enum: ['REVENUE', 'CUSTOMERS', 'RETENTION', 'LTV'] })
  @IsOptional()
  @IsString()
  metric?: string;
}

export class FunnelAnalysisDto {
  @ApiProperty({ description: 'Funnel steps', type: [String], example: ['VISIT', 'APPLY', 'APPROVE', 'DISBURSE'] })
  @IsString({ each: true })
  steps: string[];

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CohortAnalysisResult {
  @ApiProperty({ description: 'Cohort data', type: [Object] })
  cohorts: Array<{
    cohort: string;
    size: number;
    retention: Array<{ period: string; value: number; percentage: number }>;
    revenue: Array<{ period: string; value: number }>;
    ltv: number;
  }>;

  @ApiProperty({ description: 'Average retention rate', example: 0.75 })
  averageRetention: number;

  @ApiProperty({ description: 'Average LTV', example: 5000 })
  averageLTV: number;
}

export class FunnelAnalysisResult {
  @ApiProperty({ description: 'Funnel steps', type: [Object] })
  steps: Array<{
    step: string;
    count: number;
    percentage: number;
    dropOff: number;
  }>;

  @ApiProperty({ description: 'Overall conversion rate', example: 0.15 })
  conversionRate: number;

  @ApiProperty({ description: 'Bottleneck step', example: 'APPROVE' })
  bottleneckStep: string;

  @ApiProperty({ description: 'Optimization recommendations', type: [String] })
  recommendations: string[];
}

export class CustomerSegmentationResult {
  @ApiProperty({ description: 'Segments', type: [Object] })
  segments: Array<{
    segment: string;
    size: number;
    percentage: number;
    averageValue: number;
    characteristics: Record<string, any>;
  }>;

  @ApiProperty({ description: 'Total customers', example: 1000 })
  totalCustomers: number;
}

