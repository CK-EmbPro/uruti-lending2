import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class LoanRefinancingDto {
  @ApiProperty({ description: 'Current loan amount (outstanding balance)', example: 80000 })
  @IsNumber()
  @Min(1000)
  currentLoanAmount: number;

  @ApiProperty({ description: 'Current interest rate (percentage)', example: 15.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  currentInterestRate: number;

  @ApiProperty({ description: 'Remaining tenure in months', example: 24 })
  @IsNumber()
  @Min(1)
  @Max(360)
  remainingTenureMonths: number;

  @ApiProperty({ description: 'Current monthly EMI', example: 4000 })
  @IsNumber()
  @Min(0)
  currentEMI: number;

  @ApiProperty({ description: 'New interest rate (percentage)', example: 12.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  newInterestRate: number;

  @ApiPropertyOptional({ description: 'New tenure in months (if different)', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(360)
  newTenureMonths?: number;

  @ApiPropertyOptional({ description: 'Refinancing fees (percentage or fixed)', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refinancingFees?: number;

  @ApiPropertyOptional({ description: 'Refinancing fee type', enum: ['percentage', 'fixed'], default: 'percentage' })
  @IsOptional()
  @IsString()
  refinancingFeeType?: 'percentage' | 'fixed';

  @ApiPropertyOptional({ description: 'Prepayment charges on current loan (percentage)', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prepaymentCharges?: number;
}

