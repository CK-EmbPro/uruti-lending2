import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsDateString, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum RiskTier {
  EXCELLENT = 'EXCELLENT', // 900-1000
  GOOD = 'GOOD', // 700-899
  FAIR = 'FAIR', // 500-699
  POOR = 'POOR', // <500
}

export class PricingComponentsDto {
  @ApiProperty({ description: 'Base interest rate (%)', example: 12.0 })
  @IsNumber()
  baseRate: number;

  @ApiProperty({ description: 'Risk premium (%)', example: 3.5 })
  @IsNumber()
  riskPremium: number;

  @ApiProperty({ description: 'Operational cost (%)', example: 2.0 })
  @IsNumber()
  operationalCost: number;

  @ApiProperty({ description: 'Margin (%)', example: 5.0 })
  @IsNumber()
  margin: number;

  @ApiProperty({ description: 'Final interest rate (%)', example: 22.5 })
  @IsNumber()
  finalRate: number;
}

export class RiskPremiumTierDto {
  @ApiProperty({ description: 'Risk tier', enum: RiskTier, example: RiskTier.GOOD })
  riskTier: RiskTier;

  @ApiProperty({ description: 'Credit score range minimum', example: 700 })
  @IsNumber()
  scoreMin: number;

  @ApiProperty({ description: 'Credit score range maximum', example: 899 })
  @IsNumber()
  scoreMax: number;

  @ApiProperty({ description: 'Risk premium adjustment (%)', example: 0 })
  @IsNumber()
  premiumAdjustment: number; // Can be negative for excellent tier
}

export class PricingQuoteDto {
  @ApiProperty({ description: 'Loan application ID', example: 'app-123' })
  loanApplicationId: string;

  @ApiProperty({ description: 'Customer ID', example: 'customer-123' })
  customerId: string;

  @ApiProperty({ description: 'Credit score', example: 750 })
  @IsNumber()
  creditScore: number;

  @ApiProperty({ description: 'Risk tier', enum: RiskTier, example: RiskTier.GOOD })
  riskTier: RiskTier;

  @ApiProperty({ description: 'Pricing components', type: PricingComponentsDto })
  @ValidateNested()
  @Type(() => PricingComponentsDto)
  pricingComponents: PricingComponentsDto;

  @ApiProperty({ description: 'Market rate range minimum (%)', example: 15.0 })
  @IsNumber()
  marketRateMin: number;

  @ApiProperty({ description: 'Market rate range maximum (%)', example: 35.0 })
  @IsNumber()
  marketRateMax: number;

  @ApiProperty({ description: 'Pricing explanation', example: 'Your rate is based on your credit score of 750...' })
  @IsString()
  explanation: string;

  @ApiProperty({ description: 'Loan amount', example: 50000 })
  @IsNumber()
  loanAmount: number;

  @ApiProperty({ description: 'Loan term (months)', example: 12 })
  @IsNumber()
  loanTerm: number;

  @ApiProperty({ description: 'Monthly payment', example: 4500 })
  @IsNumber()
  monthlyPayment: number;

  @ApiProperty({ description: 'Total interest', example: 4000 })
  @IsNumber()
  totalInterest: number;
}

export class DynamicLimitDto {
  @ApiProperty({ description: 'Customer ID', example: 'customer-123' })
  customerId: string;

  @ApiProperty({ description: 'Current limit', example: 100000 })
  @IsNumber()
  currentLimit: number;

  @ApiProperty({ description: 'Initial limit', example: 50000 })
  @IsNumber()
  initialLimit: number;

  @ApiProperty({ description: 'Eligible for increase', example: true })
  @IsBoolean()
  eligibleForIncrease: boolean;

  @ApiProperty({ description: 'On-time payment count', example: 5 })
  @IsNumber()
  onTimePaymentCount: number;

  @ApiProperty({ description: 'Last increase date', example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  lastIncreaseDate?: string;

  @ApiProperty({ description: 'Increases this year', example: 1 })
  @IsNumber()
  increasesThisYear: number;

  @ApiProperty({ description: 'Suggested new limit', example: 120000 })
  @IsNumber()
  @IsOptional()
  suggestedNewLimit?: number;

  @ApiProperty({ description: 'Limit change reason', example: '3+ on-time payments' })
  @IsString()
  @IsOptional()
  limitChangeReason?: string;
}

export class PortfolioOptimizationDto {
  @ApiProperty({ description: 'Target yield (%)', example: 18.5 })
  @IsNumber()
  targetYield: number;

  @ApiProperty({ description: 'Current yield (%)', example: 17.2 })
  @IsNumber()
  currentYield: number;

  @ApiProperty({ description: 'Expected NPL rate (%)', example: 3.5 })
  @IsNumber()
  expectedNPLRate: number;

  @ApiProperty({ description: 'Capital utilization (%)', example: 85.0 })
  @IsNumber()
  capitalUtilization: number;

  @ApiProperty({ description: 'Diversification score', example: 0.75 })
  @IsNumber()
  diversificationScore: number;

  @ApiProperty({ description: 'Optimization recommendations', type: [String] })
  @IsArray()
  recommendations: string[];

  @ApiProperty({ description: 'Last optimization date', example: '2024-01-15' })
  @IsDateString()
  lastOptimizationDate: string;
}

export class StressTestScenarioDto {
  @ApiProperty({ description: 'Scenario name', example: '15% Unemployment' })
  @IsString()
  scenarioName: string;

  @ApiProperty({ description: 'Unemployment rate (%)', example: 15.0 })
  @IsNumber()
  unemploymentRate: number;

  @ApiProperty({ description: 'Expected NPL increase (%)', example: 5.2 })
  @IsNumber()
  expectedNPLIncrease: number;

  @ApiProperty({ description: 'Expected yield impact (%)', example: -2.5 })
  @IsNumber()
  expectedYieldImpact: number;

  @ApiProperty({ description: 'Capital at risk', example: 5000000 })
  @IsNumber()
  capitalAtRisk: number;

  @ApiProperty({ description: 'Recommendations', type: [String] })
  @IsArray()
  recommendations: string[];
}

export class CalculatePricingRequestDto {
  @ApiProperty({ description: 'Loan application ID', example: 'app-123' })
  @IsString()
  loanApplicationId: string;

  @ApiProperty({ description: 'Loan amount', example: 50000 })
  @IsNumber()
  @Min(0)
  loanAmount: number;

  @ApiProperty({ description: 'Loan term (months)', example: 12 })
  @IsNumber()
  @Min(1)
  loanTerm: number;

  @ApiPropertyOptional({ description: 'Credit score (if not in application)', example: 750 })
  @IsNumber()
  @IsOptional()
  creditScore?: number;
}

export class UpdateLimitRequestDto {
  @ApiProperty({ description: 'Customer ID', example: 'customer-123' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'New limit', example: 120000 })
  @IsNumber()
  @Min(0)
  newLimit: number;

  @ApiProperty({ description: 'Reason for change', example: '3+ on-time payments' })
  @IsString()
  reason: string;
}

