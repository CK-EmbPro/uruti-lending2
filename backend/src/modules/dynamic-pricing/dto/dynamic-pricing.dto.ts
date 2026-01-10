import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';

export class CalculateDynamicPriceDto {
  @ApiProperty({ description: 'Loan product ID', example: 'uuid' })
  @IsString()
  loanProductId: string;

  @ApiProperty({ description: 'Requested loan amount', example: 100000 })
  @IsNumber()
  @Min(0)
  requestedAmount: number;

  @ApiProperty({ description: 'Requested tenure (months)', example: 24 })
  @IsNumber()
  @Min(1)
  requestedTenure: number;

  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  @IsString()
  customerId: string;

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

  @ApiPropertyOptional({ description: 'Has existing relationship', default: false })
  @IsOptional()
  @IsBoolean()
  hasExistingRelationship?: boolean;

  @ApiPropertyOptional({ description: 'Number of previous loans', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  previousLoansCount?: number;

  @ApiPropertyOptional({ description: 'Has collateral', default: false })
  @IsOptional()
  @IsBoolean()
  hasCollateral?: boolean;

  @ApiPropertyOptional({ description: 'Loan purpose', example: 'Business Expansion' })
  @IsOptional()
  @IsString()
  loanPurpose?: string;
}

export class DynamicPricingResult {
  @ApiProperty({ description: 'Base interest rate', example: 12.5 })
  baseRate: number;

  @ApiProperty({ description: 'Final personalized rate', example: 11.0 })
  finalRate: number;

  @ApiProperty({ description: 'Rate adjustments', type: Object })
  adjustments: Array<{
    factor: string;
    adjustment: number; // Percentage points
    reason: string;
  }>;

  @ApiProperty({ description: 'Processing fee', example: 2000 })
  processingFee: number;

  @ApiProperty({ description: 'Total cost of loan', example: 112000 })
  totalCost: number;

  @ApiProperty({ description: 'EMI amount', example: 4500 })
  emi: number;

  @ApiProperty({ description: 'Pricing confidence score (0-100)', example: 85 })
  confidenceScore: number;

  @ApiProperty({ description: 'Pricing tier', example: 'PREMIUM' })
  pricingTier: 'PREMIUM' | 'STANDARD' | 'BASIC';

  @ApiProperty({ description: 'Recommendations', type: [String] })
  recommendations: string[];
}

