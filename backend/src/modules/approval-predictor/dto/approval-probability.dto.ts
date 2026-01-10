import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';

export class PredictApprovalDto {
  @ApiProperty({ description: 'Loan application ID (if existing)', example: 'uuid' })
  @IsOptional()
  @IsString()
  applicationId?: string;

  @ApiProperty({ description: 'Applicant type', enum: ApplicantType })
  @IsEnum(ApplicantType)
  applicantType: ApplicantType;

  @ApiProperty({ description: 'Applicant ID', example: 'uuid' })
  @IsString()
  applicantId: string;

  @ApiProperty({ description: 'Loan product ID', example: 'uuid' })
  @IsString()
  loanProductId: string;

  @ApiProperty({ description: 'Requested loan amount', example: 100000 })
  @IsNumber()
  @Min(0)
  requestedAmount: number;

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

  @ApiPropertyOptional({ description: 'Years of employment', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  employmentYears?: number;

  @ApiPropertyOptional({ description: 'Existing loan EMIs', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  existingLoanEMIs?: number;

  @ApiPropertyOptional({ description: 'Has collateral', default: false })
  @IsOptional()
  hasCollateral?: boolean;
}

export class ApprovalProbabilityResult {
  @ApiProperty({ description: 'Approval probability (0-1)', example: 0.75 })
  probability: number;

  @ApiProperty({ description: 'Approval probability percentage', example: 75 })
  probabilityPercentage: number;

  @ApiProperty({ description: 'Predicted outcome', enum: ['LIKELY_APPROVED', 'LIKELY_REJECTED', 'UNCERTAIN'] })
  predictedOutcome: 'LIKELY_APPROVED' | 'LIKELY_REJECTED' | 'UNCERTAIN';

  @ApiProperty({ description: 'Confidence level', enum: ['HIGH', 'MEDIUM', 'LOW'] })
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiProperty({ description: 'Key factors affecting approval', type: [Object] })
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }>;

  @ApiProperty({ description: 'Recommendations to improve approval chances', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'Estimated approved amount (if approved)', example: 80000 })
  estimatedApprovedAmount?: number;

  @ApiProperty({ description: 'Estimated interest rate', example: 12.5 })
  estimatedInterestRate?: number;
}

