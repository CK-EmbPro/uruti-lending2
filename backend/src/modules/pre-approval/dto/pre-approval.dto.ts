import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';

export class CreatePreApprovalDto {
  @ApiProperty({ description: 'Applicant ID', example: 'uuid' })
  @IsString()
  applicantId: string;

  @ApiProperty({ description: 'Applicant type', enum: ApplicantType })
  @IsEnum(ApplicantType)
  applicantType: ApplicantType;

  @ApiProperty({ description: 'Loan product ID', example: 'uuid' })
  @IsString()
  loanProductId: string;

  @ApiPropertyOptional({ description: 'Requested loan amount', example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  requestedAmount?: number;

  @ApiPropertyOptional({ description: 'Monthly income', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @ApiPropertyOptional({ description: 'Credit score', example: 750 })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(850)
  creditScore?: number;

  @ApiPropertyOptional({ description: 'Employment type', example: 'Salaried' })
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional({ description: 'Has collateral', default: false })
  @IsOptional()
  @IsBoolean()
  hasCollateral?: boolean;
}

export class PreApprovalResult {
  @ApiProperty({ description: 'Pre-approval ID', example: 'uuid' })
  preApprovalId: string;

  @ApiProperty({ description: 'Is pre-approved', example: true })
  isPreApproved: boolean;

  @ApiProperty({ description: 'Pre-approved amount', example: 80000 })
  preApprovedAmount: number;

  @ApiProperty({ description: 'Pre-approved interest rate', example: 12.5 })
  preApprovedRate: number;

  @ApiProperty({ description: 'Pre-approved tenure (months)', example: 24 })
  preApprovedTenure: number;

  @ApiProperty({ description: 'Pre-approval validity (days)', example: 30 })
  validityDays: number;

  @ApiProperty({ description: 'Expiry date', example: '2024-02-15' })
  expiryDate: string;

  @ApiProperty({ description: 'Pre-approval code', example: 'PRE-2024-001234' })
  preApprovalCode: string;

  @ApiProperty({ description: 'Conditions for pre-approval', type: [String] })
  conditions: string[];

  @ApiProperty({ description: 'Next steps', type: [String] })
  nextSteps: string[];
}

