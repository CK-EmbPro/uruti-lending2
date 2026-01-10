import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsArray, IsDateString } from 'class-validator';

export enum ReportType {
  ANNUAL_REPORT = 'ANNUAL_REPORT',
  QUARTERLY_REPORT = 'QUARTERLY_REPORT',
  MONTHLY_REPORT = 'MONTHLY_REPORT',
  COMPLIANCE_REPORT = 'COMPLIANCE_REPORT',
  AUDIT_REPORT = 'AUDIT_REPORT',
  RISK_REPORT = 'RISK_REPORT',
  CAPITAL_REPORT = 'CAPITAL_REPORT',
  LIQUIDITY_REPORT = 'LIQUIDITY_REPORT',
  CUSTOM = 'CUSTOM',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  SUBMITTED = 'SUBMITTED',
  FAILED = 'FAILED',
}

export enum Jurisdiction {
  US_FEDERAL = 'US_FEDERAL',
  US_STATE = 'US_STATE',
  EU = 'EU',
  UK = 'UK',
  INDIA = 'INDIA',
  SINGAPORE = 'SINGAPORE',
  AUSTRALIA = 'AUSTRALIA',
  CUSTOM = 'CUSTOM',
}

export class CreateRegulatoryReportDto {
  @ApiProperty({ description: 'Report name', example: 'Q4 2024 Quarterly Report' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Jurisdiction', enum: Jurisdiction })
  @IsEnum(Jurisdiction)
  jurisdiction: Jurisdiction;

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-03-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Due date (ISO format)', example: '2024-04-30' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Regulatory authority', example: 'SEC' })
  @IsOptional()
  @IsString()
  regulatoryAuthority?: string;

  @ApiPropertyOptional({ description: 'Report template ID', example: 'uuid' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Custom parameters', type: Object })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

export class RegulatoryReport {
  @ApiProperty({ description: 'Report ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Report name', example: 'Q4 2024 Quarterly Report' })
  name: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  type: ReportType;

  @ApiProperty({ description: 'Jurisdiction', enum: Jurisdiction })
  jurisdiction: Jurisdiction;

  @ApiProperty({ description: 'Status', enum: ReportStatus })
  status: ReportStatus;

  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  startDate?: string;

  @ApiProperty({ description: 'End date', example: '2024-03-31' })
  endDate?: string;

  @ApiProperty({ description: 'Due date', example: '2024-04-30' })
  dueDate?: string;

  @ApiProperty({ description: 'File path', example: '/reports/q4-2024.pdf' })
  filePath?: string;

  @ApiProperty({ description: 'File size (bytes)', example: 1048576 })
  fileSize?: number;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Submitted at', example: '2024-04-15T10:30:00Z' })
  submittedAt?: string;
}

export class CreateReportScheduleDto {
  @ApiProperty({ description: 'Schedule name', example: 'Quarterly SEC Reports' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Jurisdiction', enum: Jurisdiction })
  @IsEnum(Jurisdiction)
  jurisdiction: Jurisdiction;

  @ApiProperty({ description: 'Cron expression', example: '0 0 1 */3 *' })
  @IsString()
  cronExpression: string;

  @ApiPropertyOptional({ description: 'Days before due date to generate', example: 7 })
  @IsOptional()
  daysBeforeDue?: number;

  @ApiPropertyOptional({ description: 'Auto-submit', default: false })
  @IsOptional()
  @IsBoolean()
  autoSubmit?: boolean;

  @ApiPropertyOptional({ description: 'Notification emails', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationEmails?: string[];
}

export class ComplianceCalendar {
  @ApiProperty({ description: 'Upcoming reports', type: [Object] })
  upcomingReports: Array<{
    id: string;
    name: string;
    type: ReportType;
    dueDate: string;
    daysUntilDue: number;
    status: ReportStatus;
  }>;

  @ApiProperty({ description: 'Overdue reports', type: [Object] })
  overdueReports: Array<{
    id: string;
    name: string;
    type: ReportType;
    dueDate: string;
    daysOverdue: number;
    status: ReportStatus;
  }>;

  @ApiProperty({ description: 'Recent submissions', type: [Object] })
  recentSubmissions: Array<{
    id: string;
    name: string;
    type: ReportType;
    submittedAt: string;
    status: ReportStatus;
  }>;
}

export class RegulatoryChange {
  @ApiProperty({ description: 'Change ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Jurisdiction', enum: Jurisdiction })
  jurisdiction: Jurisdiction;

  @ApiProperty({ description: 'Change title', example: 'New Capital Requirements' })
  title: string;

  @ApiProperty({ description: 'Change description', example: 'Updated capital adequacy requirements' })
  description: string;

  @ApiProperty({ description: 'Effective date', example: '2024-06-01' })
  effectiveDate: string;

  @ApiProperty({ description: 'Impact level', example: 'HIGH', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  impactLevel: string;

  @ApiProperty({ description: 'Affected reports', type: [String] })
  affectedReports: string[];

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;
}

