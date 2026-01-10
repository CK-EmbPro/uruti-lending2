import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecisionType, DecisionOutcome } from '../entities/credit-decision.entity';

export class CreateCreditDecisionDto {
  @ApiProperty({ description: 'Loan application ID', example: 'uuid-application-1' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'Decision type', enum: DecisionType, default: DecisionType.AUTOMATED })
  @IsEnum(DecisionType)
  @IsOptional()
  decisionType?: DecisionType;

  @ApiProperty({ description: 'Decision outcome', enum: DecisionOutcome })
  @IsEnum(DecisionOutcome)
  outcome: DecisionOutcome;

  @ApiProperty({ description: 'Credit score (0-100 or 300-850)', example: 750, minimum: 0, maximum: 850 })
  @IsNumber()
  @Min(0)
  @Max(850)
  creditScore: number;

  @ApiPropertyOptional({ description: 'Debt to income ratio', example: 0.35, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  debtToIncomeRatio?: number;

  @ApiPropertyOptional({ description: 'Approved amount', example: 50000 })
  @IsNumber()
  @IsOptional()
  approvedAmount?: number;

  @ApiPropertyOptional({ description: 'Approved interest rate', example: 7.5, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  approvedInterestRate?: number;

  @ApiPropertyOptional({ description: 'Approved term in months', example: 36, minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  approvedTerm?: number;

  @ApiPropertyOptional({ description: 'Decision rationale', example: 'Applicant meets all criteria' })
  @IsString()
  @IsOptional()
  decisionRationale?: string;

  @ApiPropertyOptional({ description: 'Risk factors', example: { highDebt: true, lowIncome: false } })
  @IsObject()
  @IsOptional()
  riskFactors?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Scoring factors', example: { creditHistory: 30, income: 25 } })
  @IsObject()
  @IsOptional()
  scoringFactors?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Conditions for conditional approval', example: 'Requires co-signer' })
  @IsString()
  @IsOptional()
  conditions?: string;

  @ApiPropertyOptional({ description: 'Whether this is an override decision', default: false })
  @IsBoolean()
  @IsOptional()
  isOverride?: boolean;

  @ApiPropertyOptional({ description: 'Override justification', example: 'Strong collateral offsets risk' })
  @IsString()
  @IsOptional()
  overrideJustification?: string;
}

export class OverrideDecisionDto {
  @ApiProperty({ description: 'Loan application ID', example: 'uuid-application-1' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Override justification', example: 'Strong collateral offsets risk factors' })
  @IsString()
  overrideJustification: string;

  @ApiProperty({ description: 'Approved amount', example: 50000 })
  @IsNumber()
  approvedAmount: number;

  @ApiPropertyOptional({ description: 'Approved interest rate', example: 7.5 })
  @IsNumber()
  @IsOptional()
  approvedInterestRate?: number;

  @ApiPropertyOptional({ description: 'Approved term in months', example: 36 })
  @IsNumber()
  @IsOptional()
  approvedTerm?: number;

  @ApiPropertyOptional({ description: 'Conditions for approval', example: 'Requires additional collateral' })
  @IsString()
  @IsOptional()
  conditions?: string;
}

