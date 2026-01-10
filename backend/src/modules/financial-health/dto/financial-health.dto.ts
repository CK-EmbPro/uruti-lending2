import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';

export class CalculateFinancialHealthDto {
  @ApiProperty({ description: 'Applicant ID', example: 'uuid' })
  @IsString()
  applicantId: string;

  @ApiProperty({ description: 'Applicant type', enum: ApplicantType })
  @IsEnum(ApplicantType)
  applicantType: ApplicantType;

  @ApiPropertyOptional({ description: 'Include credit score analysis', default: true })
  @IsOptional()
  includeCreditScore?: boolean;

  @ApiPropertyOptional({ description: 'Include loan history analysis', default: true })
  @IsOptional()
  includeLoanHistory?: boolean;

  @ApiPropertyOptional({ description: 'Include payment behavior analysis', default: true })
  @IsOptional()
  includePaymentBehavior?: boolean;
}

export class FinancialHealthResult {
  @ApiProperty({ description: 'Overall health score (0-1000)', example: 750 })
  overallScore: number;

  @ApiProperty({ description: 'Health grade', enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'] })
  healthGrade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';

  @ApiProperty({ description: 'Category scores', type: Object })
  categoryScores: {
    creditScore: number;
    debtManagement: number;
    paymentHistory: number;
    incomeStability: number;
    loanUtilization: number;
  };

  @ApiProperty({ description: 'Key strengths', type: [String] })
  strengths: string[];

  @ApiProperty({ description: 'Key weaknesses', type: [String] })
  weaknesses: string[];

  @ApiProperty({ description: 'Recommendations for improvement', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'Risk level', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty({ description: 'Eligible loan amount estimate', example: 500000 })
  eligibleLoanAmount?: number;

  @ApiProperty({ description: 'Recommended interest rate range', type: Object })
  recommendedRateRange?: {
    min: number;
    max: number;
    likely: number;
  };
}

