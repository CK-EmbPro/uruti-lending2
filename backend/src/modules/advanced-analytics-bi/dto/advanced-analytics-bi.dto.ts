import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsArray, IsDateString } from 'class-validator';

export enum ReportType {
  FINANCIAL = 'FINANCIAL',
  OPERATIONAL = 'OPERATIONAL',
  RISK = 'RISK',
  COMPLIANCE = 'COMPLIANCE',
  CUSTOM = 'CUSTOM',
}

export enum ChartType {
  LINE = 'LINE',
  BAR = 'BAR',
  PIE = 'PIE',
  AREA = 'AREA',
  SCATTER = 'SCATTER',
  HEATMAP = 'HEATMAP',
  GAUGE = 'GAUGE',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateCustomReportDto {
  @ApiProperty({ description: 'Report name', example: 'Monthly Portfolio Analysis' })
  @IsString()
  reportName: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ description: 'SQL query or data source', example: 'SELECT * FROM loans WHERE status = :status' })
  @IsString()
  dataSource: string;

  @ApiPropertyOptional({ description: 'Report description', example: 'Monthly analysis of loan portfolio' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parameters', type: Object })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is scheduled', example: false })
  @IsOptional()
  @IsBoolean()
  isScheduled?: boolean;

  @ApiPropertyOptional({ description: 'Schedule cron expression', example: '0 0 1 * *' })
  @IsOptional()
  @IsString()
  scheduleCron?: string;
}

export class CreateDashboardDto {
  @ApiProperty({ description: 'Dashboard name', example: 'Executive Dashboard' })
  @IsString()
  dashboardName: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Executive-level KPIs and metrics' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is public', example: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Widget configurations', type: [Object] })
  @IsOptional()
  @IsArray()
  widgets?: Array<{
    widgetType: string;
    title: string;
    config: Record<string, any>;
    position: { x: number; y: number; w: number; h: number };
  }>;
}

export class CreateVisualizationDto {
  @ApiProperty({ description: 'Visualization name', example: 'Loan Volume Trend' })
  @IsString()
  visualizationName: string;

  @ApiProperty({ description: 'Chart type', enum: ChartType })
  @IsEnum(ChartType)
  chartType: ChartType;

  @ApiProperty({ description: 'Data query', example: 'SELECT date, SUM(amount) FROM loans GROUP BY date' })
  @IsString()
  dataQuery: string;

  @ApiPropertyOptional({ description: 'Chart configuration', type: Object })
  @IsOptional()
  @IsObject()
  chartConfig?: Record<string, any>;
}

export class CustomReport {
  @ApiProperty({ description: 'Report ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Report name' })
  reportName: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  reportType: ReportType;

  @ApiProperty({ description: 'Status', enum: ReportStatus })
  status: ReportStatus;

  @ApiProperty({ description: 'Execution count', example: 150 })
  executionCount: number;

  @ApiProperty({ description: 'Last executed', example: '2024-01-15T00:00:00Z' })
  lastExecutedAt?: Date;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

export class Dashboard {
  @ApiProperty({ description: 'Dashboard ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Dashboard name' })
  dashboardName: string;

  @ApiProperty({ description: 'Widget count', example: 12 })
  widgetCount: number;

  @ApiProperty({ description: 'Is public', example: false })
  isPublic: boolean;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

export class DataInsight {
  @ApiProperty({ description: 'Insight ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Insight title', example: 'Portfolio Growth Trend' })
  title: string;

  @ApiProperty({ description: 'Insight description' })
  description: string;

  @ApiProperty({ description: 'Confidence score', example: 0.85 })
  confidence: number;

  @ApiProperty({ description: 'Recommendations', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'Generated date', example: '2024-01-15T00:00:00Z' })
  generatedAt: Date;
}

