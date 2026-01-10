import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum AutoApprovalStatus {
  ELIGIBLE = 'ELIGIBLE',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
  CONDITIONAL = 'CONDITIONAL',
  REQUIRES_MANUAL_REVIEW = 'REQUIRES_MANUAL_REVIEW',
}

export class AutoApprovalCriteriaDto {
  @ApiProperty({ description: 'Minimum credit score threshold', example: 650 })
  @IsNumber()
  minCreditScore: number;

  @ApiProperty({ description: 'Maximum allowed fraud flags', example: 0 })
  @IsNumber()
  maxFraudFlags: number;

  @ApiProperty({ description: 'Maximum pre-approved limit', example: 50000 })
  @IsNumber()
  maxPreApprovedLimit: number;

  @ApiProperty({ description: 'Whether complete documentation is required', example: true })
  @IsBoolean()
  requiresCompleteDocumentation: boolean;

  @ApiProperty({ description: 'Whether clean KYC/AML is required', example: true })
  @IsBoolean()
  requiresCleanKYCAML: boolean;
}

export class AutoApprovalRequestDto {
  @ApiProperty({ description: 'Application ID' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'Custom approval criteria (uses defaults if not provided)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AutoApprovalCriteriaDto)
  criteria?: AutoApprovalCriteriaDto;
}

export class CriteriaCheckResultDto {
  @ApiProperty({ description: 'Name of the criteria being checked' })
  checkName: string;

  @ApiProperty({ description: 'Whether the criteria passed' })
  passed: boolean;

  @ApiPropertyOptional({ description: 'Reason for pass/fail' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Actual value (if applicable)' })
  actualValue?: any;

  @ApiPropertyOptional({ description: 'Required value (if applicable)' })
  requiredValue?: any;
}

export class AutoApprovalResultDto {
  @ApiProperty({ description: 'Application ID' })
  applicationId: string;

  @ApiProperty({ description: 'Auto-approval status', enum: AutoApprovalStatus })
  status: AutoApprovalStatus;

  @ApiProperty({ description: 'Risk level', enum: RiskLevel })
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'Credit score' })
  creditScore: number;

  @ApiProperty({ description: 'Whether auto-approval is eligible' })
  eligible: boolean;

  @ApiProperty({ description: 'List of criteria checks performed' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriteriaCheckResultDto)
  criteriaChecks: CriteriaCheckResultDto[];

  @ApiPropertyOptional({ description: 'Approved amount (if approved)' })
  approvedAmount?: number;

  @ApiPropertyOptional({ description: 'Approved interest rate (if approved)' })
  approvedInterestRate?: number;

  @ApiPropertyOptional({ description: 'Approved term in months (if approved)' })
  approvedTerm?: number;

  @ApiPropertyOptional({ description: 'Conditions for conditional approval' })
  conditions?: string[];

  @ApiProperty({ description: 'Decision rationale' })
  rationale: string;

  @ApiProperty({ description: 'Whether fraud flags were detected' })
  hasFraudFlags: boolean;

  @ApiProperty({ description: 'Number of fraud flags' })
  fraudFlagCount: number;

  @ApiProperty({ description: 'Whether documentation is complete' })
  documentationComplete: boolean;

  @ApiProperty({ description: 'Whether KYC/AML checks passed' })
  kycAmlClean: boolean;

  @ApiProperty({ description: 'Whether within pre-approved limit' })
  withinPreApprovedLimit: boolean;
}

