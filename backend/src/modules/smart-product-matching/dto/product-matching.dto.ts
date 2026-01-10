import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';

export class MatchProductsDto {
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

  @ApiPropertyOptional({ description: 'Loan purpose', example: 'Business Expansion' })
  @IsOptional()
  @IsString()
  loanPurpose?: string;

  @ApiPropertyOptional({ description: 'Preferred tenure (months)', example: 24 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  preferredTenure?: number;

  @ApiPropertyOptional({ description: 'Has collateral', default: false })
  @IsOptional()
  @IsBoolean()
  hasCollateral?: boolean;

  @ApiPropertyOptional({ description: 'Maximum EMI capacity', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxEMICapacity?: number;
}

export class ProductMatchResult {
  @ApiProperty({ description: 'Matched products', type: [Object] })
  matches: Array<{
    productId: string;
    productName: string;
    matchScore: number; // 0-100
    matchReasons: string[];
    estimatedEMI: number;
    estimatedTotalCost: number;
    estimatedInterest: number;
    eligibilityStatus: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE';
    eligibilityScore: number; // 0-100
    recommendedAmount?: number;
    recommendedTenure?: number;
    benefits: string[];
    drawbacks: string[];
  }>;

  @ApiProperty({ description: 'Best match product', type: Object })
  bestMatch: {
    productId: string;
    productName: string;
    matchScore: number;
    reason: string;
  };

  @ApiProperty({ description: 'Alternative options', type: [Object] })
  alternatives: Array<{
    productId: string;
    productName: string;
    matchScore: number;
    reason: string;
  }>;

  @ApiProperty({ description: 'Recommendations', type: [String] })
  recommendations: string[];
}

