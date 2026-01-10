import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CostComparisonDto {
  @ApiProperty({ description: 'Loan amount', example: 1000 })
  @IsNumber()
  @Min(1)
  loanAmount: number;

  @ApiProperty({ description: 'Annual interest rate (%)', example: 12 })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @ApiProperty({ description: 'Loan tenure in months', example: 12 })
  @IsNumber()
  @Min(1)
  tenureMonths: number;

  @ApiPropertyOptional({ description: 'Repayment frequency', enum: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'], default: 'Monthly' })
  @IsString()
  @IsOptional()
  repaymentFrequency?: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';

  @ApiPropertyOptional({ description: 'Processing fee', example: 0 })
  @IsNumber()
  @IsOptional()
  processingFee?: number;

  @ApiPropertyOptional({ description: 'Processing fee type', enum: ['percentage', 'fixed'], default: 'percentage' })
  @IsString()
  @IsOptional()
  processingFeeType?: 'percentage' | 'fixed';

  @ApiPropertyOptional({ description: 'Graduation rate for graduated payments (%)', example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(20)
  graduationRate?: number;

  @ApiPropertyOptional({ description: 'Seasonal pattern configuration' })
  @IsOptional()
  seasonalPattern?: {
    high: number[]; // Months with high payments (1-12)
    low: number[]; // Months with low payments (1-12)
    highMultiplier?: number;
    lowMultiplier?: number;
  };
}

export interface RepaymentStructureResultDto {
  structureType: string;
  totalInterest: number;
  totalAmount: number;
  totalCost: number;
  monthlyPayments: Array<{
    period: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
  minPayment: number;
  maxPayment: number;
  averagePayment: number;
}

export class CostComparisonResultDto {
  @ApiProperty({ description: 'Fixed payment structure details' })
  fixed: RepaymentStructureResultDto;

  @ApiProperty({ description: 'Graduated payment structure details' })
  graduated: RepaymentStructureResultDto;

  @ApiProperty({ description: 'Seasonal payment structure details' })
  seasonal: RepaymentStructureResultDto;

  @ApiProperty({ description: 'Bullet payment structure details' })
  bullet: RepaymentStructureResultDto;

  @ApiProperty({ description: 'Summary comparison' })
  summary: {
    cheapest: string; // Structure type with lowest total cost
    mostExpensive: string; // Structure type with highest total cost
    lowestMonthlyPayment: { structure: string; amount: number };
    highestMonthlyPayment: { structure: string; amount: number };
  };
}

