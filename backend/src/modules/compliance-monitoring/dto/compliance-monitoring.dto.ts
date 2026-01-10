import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max } from 'class-validator';

export enum ComplianceRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ComplianceCheckType {
  KYC = 'KYC',
  AML = 'AML',
  PRIVACY = 'PRIVACY',
  DATA_RETENTION = 'DATA_RETENTION',
  REGULATORY = 'REGULATORY',
  DOCUMENT = 'DOCUMENT',
  AUDIT = 'AUDIT',
}

export class ComplianceMonitoringDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Check type filter', enum: ComplianceCheckType })
  @IsOptional()
  @IsEnum(ComplianceCheckType)
  checkType?: ComplianceCheckType;

  @ApiPropertyOptional({ description: 'Risk level filter', enum: ComplianceRiskLevel })
  @IsOptional()
  @IsEnum(ComplianceRiskLevel)
  riskLevel?: ComplianceRiskLevel;
}

export class ComplianceMonitoringResult {
  @ApiProperty({ description: 'Overall compliance score (0-100)', example: 85 })
  overallScore: number;

  @ApiProperty({ description: 'Overall risk level', enum: ComplianceRiskLevel })
  overallRiskLevel: ComplianceRiskLevel;

  @ApiProperty({ description: 'Total checks performed', example: 150 })
  totalChecks: number;

  @ApiProperty({ description: 'Passed checks', example: 135 })
  passedChecks: number;

  @ApiProperty({ description: 'Failed checks', example: 10 })
  failedChecks: number;

  @ApiProperty({ description: 'Pending checks', example: 5 })
  pendingChecks: number;

  @ApiProperty({ description: 'Critical issues', example: 2 })
  criticalIssues: number;

  @ApiProperty({ description: 'High risk issues', example: 5 })
  highRiskIssues: number;

  @ApiProperty({ description: 'Compliance breakdown by type', type: Object })
  breakdownByType: Record<ComplianceCheckType, {
    total: number;
    passed: number;
    failed: number;
    score: number;
  }>;

  @ApiProperty({ description: 'Risk breakdown', type: Object })
  riskBreakdown: Record<ComplianceRiskLevel, number>;

  @ApiProperty({ description: 'Recent issues', type: [Object] })
  recentIssues: Array<{
    id: string;
    type: ComplianceCheckType;
    riskLevel: ComplianceRiskLevel;
    description: string;
    detectedAt: string;
    status: string;
  }>;

  @ApiProperty({ description: 'Trend data (last 30 days)', type: [Object] })
  trendData: Array<{
    date: string;
    score: number;
    checks: number;
    passed: number;
    failed: number;
  }>;
}

export class ComplianceAlertDto {
  @ApiProperty({ description: 'Alert ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Alert type', enum: ComplianceCheckType })
  type: ComplianceCheckType;

  @ApiProperty({ description: 'Risk level', enum: ComplianceRiskLevel })
  riskLevel: ComplianceRiskLevel;

  @ApiProperty({ description: 'Alert title', example: 'KYC Screening Failed' })
  title: string;

  @ApiProperty({ description: 'Alert description', example: 'Application failed KYC screening due to sanctions list match' })
  description: string;

  @ApiProperty({ description: 'Entity ID (application, loan, etc.)', example: 'uuid' })
  entityId: string;

  @ApiProperty({ description: 'Entity type', example: 'LoanApplication' })
  entityType: string;

  @ApiProperty({ description: 'Is acknowledged', example: false })
  isAcknowledged: boolean;

  @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
  createdAt: string;
}

