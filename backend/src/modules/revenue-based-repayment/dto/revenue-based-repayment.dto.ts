import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsBoolean, IsEnum, IsDateString, Min, Max, IsArray } from 'class-validator';
import { RevenuePeriod } from '../entities/revenue-based-repayment-config.entity';
import { RevenueSource } from '../entities/revenue-tracking.entity';

export class CreateRevenueBasedRepaymentConfigDto {
  @ApiProperty({ description: 'Loan ID (optional if product-level config)', example: 'loan-uuid' })
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiProperty({ description: 'Loan Product ID (optional if loan-level config)', example: 'product-uuid' })
  @IsString()
  @IsOptional()
  loanProductId?: string;

  @ApiProperty({ description: 'Repayment percentage of revenue', example: 10.5, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  repaymentPercentage: number;

  @ApiProperty({ description: 'Revenue period', enum: RevenuePeriod, example: RevenuePeriod.MONTHLY })
  @IsEnum(RevenuePeriod)
  revenuePeriod: RevenuePeriod;

  @ApiPropertyOptional({ description: 'Minimum repayment amount (floor)', example: 100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumRepaymentAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum repayment amount (ceiling)', example: 5000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maximumRepaymentAmount?: number;

  @ApiPropertyOptional({ description: 'Revenue source integration IDs' })
  @IsOptional()
  revenueSources?: {
    paymentGateway?: string[];
    accountingSystem?: string[];
    bankAccount?: string[];
  };

  @ApiPropertyOptional({ description: 'Require bank statement verification', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  requireVerification?: boolean;

  @ApiPropertyOptional({ description: 'Auto-calculate repayments', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  autoCalculate?: boolean;

  @ApiPropertyOptional({ description: 'Verification threshold percentage', example: 5, default: 5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  verificationThreshold?: number;
}

export class RecordRevenueDto {
  @ApiProperty({ description: 'Loan ID', example: 'loan-uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Revenue amount', example: 1000 })
  @IsNumber()
  @Min(0)
  revenueAmount: number;

  @ApiProperty({ description: 'Revenue date', example: '2024-01-15' })
  @IsDateString()
  revenueDate: string;

  @ApiProperty({ description: 'Revenue source', enum: RevenueSource, example: RevenueSource.PAYMENT_GATEWAY })
  @IsEnum(RevenueSource)
  source: RevenueSource;

  @ApiPropertyOptional({ description: 'Integration ID', example: 'integration-uuid' })
  @IsString()
  @IsOptional()
  integrationId?: string;

  @ApiPropertyOptional({ description: 'External reference ID', example: 'ext-ref-123' })
  @IsString()
  @IsOptional()
  externalReferenceId?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Payment from customer' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CalculateRepaymentDto {
  @ApiProperty({ description: 'Loan ID', example: 'loan-uuid' })
  @IsString()
  loanId: string;

  @ApiPropertyOptional({ description: 'Period start date', example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  periodStartDate?: string;

  @ApiPropertyOptional({ description: 'Period end date', example: '2024-01-31' })
  @IsDateString()
  @IsOptional()
  periodEndDate?: string;
}

export class VerifyRevenueDto {
  @ApiProperty({ description: 'Revenue tracking ID', example: 'revenue-uuid' })
  @IsString()
  revenueTrackingId: string;

  @ApiProperty({ description: 'Bank account ID', example: 'bank-account-uuid' })
  @IsString()
  bankAccountId: string;
}

