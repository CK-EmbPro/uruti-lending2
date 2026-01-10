import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsObject,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import {
  RegulatoryChangeStatus,
  RegulatoryChangePriority,
  RegulatorySource,
} from '../entities/regulatory-change.entity';
import {
  ComplianceCheckType,
  ComplianceCheckStatus,
} from '../entities/compliance-check.entity';
import { PolicyStatus, PolicyCategory } from '../entities/compliance-policy.entity';
import { ReportType, ReportFrequency } from '../entities/compliance-report.entity';

export class CreateRegulatoryChangeDto {
  @ApiProperty({ description: 'Regulatory change title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description of the regulatory change' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Regulatory source', enum: RegulatorySource })
  @IsEnum(RegulatorySource)
  source: RegulatorySource;

  @ApiPropertyOptional({ description: 'Regulation number' })
  @IsString()
  @IsOptional()
  regulationNumber?: string;

  @ApiProperty({ description: 'Effective date (YYYY-MM-DD)' })
  @IsDateString()
  effectiveDate: string;

  @ApiPropertyOptional({ description: 'Compliance deadline (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  complianceDeadline?: string;

  @ApiPropertyOptional({ description: 'Priority', enum: RegulatoryChangePriority, default: RegulatoryChangePriority.MEDIUM })
  @IsEnum(RegulatoryChangePriority)
  @IsOptional()
  priority?: RegulatoryChangePriority;

  @ApiPropertyOptional({ description: 'Affected areas', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  affectedAreas?: string[];

  @ApiPropertyOptional({ description: 'Required actions' })
  @IsObject()
  @IsOptional()
  requiredActions?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Source URL' })
  @IsString()
  @IsOptional()
  sourceUrl?: string;
}

export class RunComplianceCheckDto {
  @ApiProperty({ description: 'Entity type' })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'Entity ID' })
  @IsString()
  entityId: string;

  @ApiProperty({ description: 'Check type', enum: ComplianceCheckType })
  @IsEnum(ComplianceCheckType)
  checkType: ComplianceCheckType;

  @ApiPropertyOptional({ description: 'Policy ID to check against' })
  @IsUUID()
  @IsOptional()
  policyId?: string;
}

export class CreateCompliancePolicyDto {
  @ApiProperty({ description: 'Policy name' })
  @IsString()
  policyName: string;

  @ApiPropertyOptional({ description: 'Policy number' })
  @IsString()
  @IsOptional()
  policyNumber?: string;

  @ApiProperty({ description: 'Policy category', enum: PolicyCategory })
  @IsEnum(PolicyCategory)
  category: PolicyCategory;

  @ApiProperty({ description: 'Policy description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Full policy text' })
  @IsString()
  @IsOptional()
  policyText?: string;

  @ApiProperty({ description: 'Effective date (YYYY-MM-DD)' })
  @IsDateString()
  effectiveDate: string;

  @ApiPropertyOptional({ description: 'Expiration date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional({ description: 'Compliance requirements' })
  @IsObject()
  @IsOptional()
  complianceRequirements?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Applicable entity types', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableEntities?: string[];
}

export class GenerateComplianceReportDto {
  @ApiProperty({ description: 'Report name' })
  @IsString()
  reportName: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ description: 'Report period start date (YYYY-MM-DD)' })
  @IsDateString()
  reportPeriod: string;

  @ApiPropertyOptional({ description: 'Report period end date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  reportPeriodEnd?: string;

  @ApiPropertyOptional({ description: 'Report frequency', enum: ReportFrequency })
  @IsEnum(ReportFrequency)
  @IsOptional()
  frequency?: ReportFrequency;

  @ApiPropertyOptional({ description: 'Additional parameters' })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;
}

export class GetComplianceChecksDto {
  @ApiPropertyOptional({ description: 'Entity type' })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID' })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Check type', enum: ComplianceCheckType })
  @IsEnum(ComplianceCheckType)
  @IsOptional()
  checkType?: ComplianceCheckType;

  @ApiPropertyOptional({ description: 'Status', enum: ComplianceCheckStatus })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Results per page', minimum: 1, maximum: 100, default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

