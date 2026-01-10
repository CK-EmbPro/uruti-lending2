import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsDateString } from 'class-validator';

export enum ReportType {
  LOAN_PORTFOLIO = 'LOAN_PORTFOLIO',
  CUSTOMER_ANALYTICS = 'CUSTOMER_ANALYTICS',
  FINANCIAL_SUMMARY = 'FINANCIAL_SUMMARY',
  COLLECTION_REPORT = 'COLLECTION_REPORT',
  RISK_ANALYSIS = 'RISK_ANALYSIS',
  OPERATIONAL_METRICS = 'OPERATIONAL_METRICS',
  COMPLIANCE_REPORT = 'COMPLIANCE_REPORT',
  CUSTOM = 'CUSTOM',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON',
  HTML = 'HTML',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class CreateReportDto {
  @ApiProperty({ description: 'Report name', example: 'Monthly Portfolio Report' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Report format', enum: ReportFormat, default: ReportFormat.PDF })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filters', type: Object })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Custom query', example: 'SELECT * FROM loans WHERE status = "ACTIVE"' })
  @IsOptional()
  @IsString()
  customQuery?: string;

  @ApiPropertyOptional({ description: 'Include charts', default: true })
  @IsOptional()
  includeCharts?: boolean;

  @ApiPropertyOptional({ description: 'Include tables', default: true })
  @IsOptional()
  includeTables?: boolean;
}

export class ReportResult {
  @ApiProperty({ description: 'Report ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Report name', example: 'Monthly Portfolio Report' })
  name: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  type: ReportType;

  @ApiProperty({ description: 'Report format', enum: ReportFormat })
  format: ReportFormat;

  @ApiProperty({ description: 'Status', enum: ReportStatus })
  status: ReportStatus;

  @ApiProperty({ description: 'File path', example: '/reports/report-2024-01-15.pdf' })
  filePath?: string;

  @ApiProperty({ description: 'File size (bytes)', example: 1048576 })
  fileSize?: number;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Completed at', example: '2024-01-15T10:35:00Z' })
  completedAt?: string;

  @ApiProperty({ description: 'Error message', example: null })
  errorMessage?: string;

  @ApiProperty({ description: 'Preview data', type: Object })
  previewData?: Record<string, any>;
}

export class ReportTemplate {
  @ApiProperty({ description: 'Template ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Template name', example: 'Standard Portfolio Report' })
  name: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  type: ReportType;

  @ApiProperty({ description: 'Template configuration', type: Object })
  configuration: Record<string, any>;

  @ApiProperty({ description: 'Is default', example: false })
  isDefault: boolean;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;
}

export class CreateReportTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Standard Portfolio Report' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Template configuration', type: Object })
  @IsObject()
  configuration: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is default', default: false })
  @IsOptional()
  isDefault?: boolean;
}

export class ReportSchedule {
  @ApiProperty({ description: 'Schedule ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Schedule name', example: 'Monthly Portfolio Report' })
  name: string;

  @ApiProperty({ description: 'Report template ID', example: 'uuid' })
  templateId: string;

  @ApiProperty({ description: 'Cron expression', example: '0 0 1 * *' })
  cronExpression: string;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last run', example: '2024-01-15T00:00:00Z' })
  lastRun?: string;

  @ApiProperty({ description: 'Next run', example: '2024-02-01T00:00:00Z' })
  nextRun?: string;
}

export class CreateReportScheduleDto {
  @ApiProperty({ description: 'Schedule name', example: 'Monthly Portfolio Report' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Report template ID', example: 'uuid' })
  @IsString()
  templateId: string;

  @ApiProperty({ description: 'Cron expression', example: '0 0 1 * *' })
  @IsString()
  cronExpression: string;
}

