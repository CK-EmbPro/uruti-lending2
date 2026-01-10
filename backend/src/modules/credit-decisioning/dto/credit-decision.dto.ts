import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';

export enum DecisionStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REFERRED = 'REFERRED', // Needs manual review
  CONDITIONAL = 'CONDITIONAL', // Approved with conditions
}

export class CreditDecisionRequestDto {
  @ApiProperty({ description: 'Loan application ID', example: 'uuid' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Applicant ID', example: 'uuid' })
  @IsString()
  applicantId: string;

  @ApiProperty({ description: 'Applicant type', enum: ApplicantType })
  @IsEnum(ApplicantType)
  applicantType: ApplicantType;

  @ApiProperty({ description: 'Requested loan amount', example: 100000 })
  @IsNumber()
  @Min(0)
  requestedAmount: number;

  @ApiPropertyOptional({ description: 'Credit score', example: 750 })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(850)
  creditScore?: number;

  @ApiPropertyOptional({ description: 'Monthly income', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @ApiPropertyOptional({ description: 'Monthly expenses', example: 30000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyExpenses?: number;

  @ApiPropertyOptional({ description: 'Employment duration (months)', example: 24 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  employmentDurationMonths?: number;

  @ApiPropertyOptional({ description: 'Has existing loans', default: false })
  @IsOptional()
  @IsBoolean()
  hasExistingLoans?: boolean;

  @ApiPropertyOptional({ description: 'Number of existing loans', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  existingLoansCount?: number;

  @ApiPropertyOptional({ description: 'Has collateral', default: false })
  @IsOptional()
  @IsBoolean()
  hasCollateral?: boolean;

  @ApiPropertyOptional({ description: 'Collateral value', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  collateralValue?: number;

  @ApiPropertyOptional({ description: 'Loan product ID', example: 'uuid' })
  @IsOptional()
  @IsString()
  loanProductId?: string;
}

export class CreditDecisionResultDto {
  @ApiProperty({ description: 'Decision status', enum: DecisionStatus })
  decision: DecisionStatus;

  @ApiProperty({ description: 'Approved amount (if approved)', example: 100000 })
  approvedAmount?: number;

  @ApiProperty({ description: 'Approved interest rate (if approved)', example: 12.5 })
  approvedInterestRate?: number;

  @ApiProperty({ description: 'Approved tenure (months, if approved)', example: 24 })
  approvedTenure?: number;

  @ApiProperty({ description: 'Decision confidence score (0-100)', example: 85 })
  confidenceScore: number;

  @ApiProperty({ description: 'Risk score (0-100, higher = riskier)', example: 25 })
  riskScore: number;

  @ApiProperty({ description: 'Decision factors', type: Object })
  factors: {
    creditScore: number;
    debtToIncome: number;
    employmentStability: number;
    loanToIncome: number;
    collateral: number;
    history: number;
    [key: string]: number;
  };

  @ApiProperty({ description: 'Decision reasons', type: [String] })
  reasons: string[];

  @ApiProperty({ description: 'Conditions (if conditional)', type: [String] })
  conditions?: string[];

  @ApiProperty({ description: 'Recommendations', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'Processing time (ms)', example: 150 })
  processingTimeMs: number;
}

