import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomerProfileDto {
  @ApiPropertyOptional({ description: 'Customer age', example: 35, minimum: 18, maximum: 100 })
  @IsNumber()
  @Min(18)
  @Max(100)
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({ description: 'Monthly income', example: 5000, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyIncome?: number;

  @ApiPropertyOptional({ description: 'Annual income', example: 60000, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  annualIncome?: number;

  @ApiPropertyOptional({ description: 'Employment type', example: 'Salaried' })
  @IsString()
  @IsOptional()
  employmentType?: string;

  @ApiPropertyOptional({ description: 'Employment duration in months', example: 24, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  employmentDuration?: number;

  @ApiPropertyOptional({ description: 'Credit score', example: 650, minimum: 300, maximum: 850 })
  @IsNumber()
  @Min(300)
  @Max(850)
  @IsOptional()
  creditScore?: number;

  @ApiPropertyOptional({ description: 'Requested loan amount', example: 10000, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  requestedAmount?: number;

  @ApiPropertyOptional({ description: 'Preferred loan term in months', example: 12, minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  preferredTerm?: number;

  @ApiPropertyOptional({ description: 'Loan use case', example: 'Business Expansion' })
  @IsString()
  @IsOptional()
  useCase?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'US' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Region/State code', example: 'CA' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ description: 'Has collateral', example: false })
  @IsBoolean()
  @IsOptional()
  hasCollateral?: boolean;

  @ApiPropertyOptional({ description: 'Number of existing loans', example: 0, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  existingLoans?: number;

  @ApiPropertyOptional({ description: 'Debt to income ratio (percentage)', example: 30, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  debtToIncomeRatio?: number;
}

export class RecommendProductsDto {
  @ApiProperty({ description: 'Customer profile', type: CustomerProfileDto })
  @ValidateNested()
  @Type(() => CustomerProfileDto)
  customerProfile: CustomerProfileDto;

  @ApiProperty({ description: 'Company ID', example: 'company-uuid' })
  @IsString()
  companyId: string;

  @ApiPropertyOptional({ description: 'Maximum number of recommendations', example: 5, default: 5, minimum: 1, maximum: 20 })
  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Include products customer does not qualify for', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  includeNotEligible?: boolean;
}

export class ProductRecommendationResponseDto {
  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Product code' })
  productCode: string;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'Match score (0-1)', example: 0.95 })
  matchScore: number;

  @ApiProperty({ description: 'Recommendation reasons', type: [String] })
  reasons: string[];

  @ApiProperty({ description: 'Estimated approval probability (0-1)', example: 0.85 })
  estimatedApproval: number;

  @ApiPropertyOptional({ description: 'Estimated loan amount' })
  estimatedAmount?: number;

  @ApiPropertyOptional({ description: 'Estimated interest rate' })
  estimatedRate?: number;

  @ApiPropertyOptional({ description: 'Estimated monthly payment' })
  estimatedMonthlyPayment?: number;

  @ApiProperty({ description: 'Eligibility status', enum: ['ELIGIBLE', 'PARTIALLY_ELIGIBLE', 'NOT_ELIGIBLE'] })
  eligibilityStatus: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE';

  @ApiPropertyOptional({ description: 'Missing requirements', type: [String] })
  missingRequirements?: string[];

  @ApiProperty({ description: 'Loan category' })
  loanCategory?: string;

  @ApiProperty({ description: 'Product type' })
  productType?: string;

  @ApiProperty({ description: 'Interest rate' })
  rateOfInterest: number;

  @ApiProperty({ description: 'Minimum loan amount' })
  minimumLoanAmount?: number;

  @ApiProperty({ description: 'Maximum loan amount' })
  maximumLoanAmount?: number;

  @ApiProperty({ description: 'Minimum term' })
  minimumTerm?: number;

  @ApiProperty({ description: 'Maximum term' })
  maximumTerm?: number;
}

