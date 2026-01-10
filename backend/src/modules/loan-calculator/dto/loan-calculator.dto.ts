import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class LoanCalculatorDto {
  @ApiProperty({ description: 'Loan amount (principal)', example: 100000 })
  @IsNumber()
  @Min(1000)
  loanAmount: number;

  @ApiProperty({ description: 'Annual interest rate (percentage)', example: 12.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @ApiProperty({ description: 'Loan tenure in months', example: 24 })
  @IsNumber()
  @Min(1)
  @Max(360)
  tenureMonths: number;

  @ApiPropertyOptional({ description: 'Repayment frequency', enum: ['Monthly', 'Quarterly', 'Bi-Weekly', 'Weekly'], default: 'Monthly' })
  @IsOptional()
  @IsString()
  repaymentFrequency?: string;

  @ApiPropertyOptional({ description: 'Processing fee (percentage or fixed amount)', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  processingFee?: number;

  @ApiPropertyOptional({ description: 'Processing fee type', enum: ['percentage', 'fixed'], default: 'percentage' })
  @IsOptional()
  @IsString()
  processingFeeType?: 'percentage' | 'fixed';
}

export class AmortizationScheduleDto extends LoanCalculatorDto {
  @ApiPropertyOptional({ description: 'Start date for the loan (ISO format)', example: '2024-01-15' })
  @IsOptional()
  @IsString()
  startDate?: string;
}

export class LoanEligibilityDto {
  @ApiProperty({ description: 'Monthly income', example: 50000 })
  @IsNumber()
  @Min(0)
  monthlyIncome: number;

  @ApiProperty({ description: 'Monthly expenses', example: 30000 })
  @IsNumber()
  @Min(0)
  monthlyExpenses: number;

  @ApiPropertyOptional({ description: 'Existing loan EMIs', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  existingLoanEMIs?: number;

  @ApiProperty({ description: 'Requested loan amount', example: 200000 })
  @IsNumber()
  @Min(1000)
  requestedAmount: number;

  @ApiPropertyOptional({ description: 'Credit score (if available)', example: 750 })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(850)
  creditScore?: number;

  @ApiPropertyOptional({ description: 'Employment type', enum: ['Salaried', 'Self-Employed', 'Business'], default: 'Salaried' })
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional({ description: 'Years of employment', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  employmentYears?: number;
}

export class LoanComparisonDto {
  @ApiProperty({ description: 'Loan amount', example: 100000 })
  @IsNumber()
  @Min(1000)
  loanAmount: number;

  @ApiProperty({ description: 'Loan tenure in months', example: 24 })
  @IsNumber()
  @Min(1)
  @Max(360)
  tenureMonths: number;

  @ApiProperty({ description: 'Loan products to compare (array of product IDs or rates)', type: [Object] })
  loanProducts: Array<{
    productId?: string;
    productName: string;
    interestRate: number;
    processingFee?: number;
    processingFeeType?: 'percentage' | 'fixed';
  }>;
}

export class EarlyRepaymentCalculatorDto {
  @ApiProperty({ description: 'Original loan amount', example: 100000 })
  @IsNumber()
  @Min(1000)
  originalLoanAmount: number;

  @ApiProperty({ description: 'Annual interest rate (percentage)', example: 12.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @ApiProperty({ description: 'Original tenure in months', example: 36 })
  @IsNumber()
  @Min(1)
  originalTenureMonths: number;

  @ApiProperty({ description: 'Months already paid', example: 12 })
  @IsNumber()
  @Min(0)
  monthsPaid: number;

  @ApiProperty({ description: 'Early repayment amount', example: 50000 })
  @IsNumber()
  @Min(0)
  earlyRepaymentAmount: number;

  @ApiPropertyOptional({ description: 'Prepayment charges (percentage)', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prepaymentCharges?: number;
}

export class RateEstimatorDto {
  @ApiProperty({ description: 'Loan amount', example: 100000 })
  @IsNumber()
  @Min(1000)
  loanAmount: number;

  @ApiProperty({ description: 'Loan tenure in months', example: 24 })
  @IsNumber()
  @Min(1)
  @Max(360)
  tenureMonths: number;

  @ApiProperty({ description: 'Monthly income', example: 50000 })
  @IsNumber()
  @Min(0)
  monthlyIncome: number;

  @ApiPropertyOptional({ description: 'Credit score', example: 750 })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(850)
  creditScore?: number;

  @ApiPropertyOptional({ description: 'Employment type', enum: ['Salaried', 'Self-Employed', 'Business'] })
  @IsOptional()
  @IsString()
  employmentType?: string;
}

