import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RepaymentType } from '../../../common/enums/repayment-type.enum';

export class CreateLoanRepaymentDto {
  @ApiProperty({ description: 'Loan ID', example: 'loan-uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Posting date (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  postingDate: string;

  @ApiPropertyOptional({ description: 'Value date (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  valueDate?: string;

  @ApiProperty({ description: 'Total amount paid', example: 5000, minimum: 0 })
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @ApiPropertyOptional({ description: 'Principal amount paid', example: 4000, minimum: 0, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  principalPaid?: number;

  @ApiPropertyOptional({ description: 'Interest amount paid', example: 800, minimum: 0, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  interestPaid?: number;

  @ApiPropertyOptional({ description: 'Penalty amount paid', example: 200, minimum: 0, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  penaltyPaid?: number;

  @ApiPropertyOptional({ description: 'Charges paid', example: 0, minimum: 0, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  chargesPaid?: number;

  @ApiPropertyOptional({ description: 'Excess amount', example: 0, minimum: 0, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  excessAmount?: number;

  @ApiPropertyOptional({
    description: 'Repayment type',
    enum: RepaymentType,
    example: RepaymentType.NORMAL_REPAYMENT,
    default: RepaymentType.NORMAL_REPAYMENT,
  })
  @IsEnum(RepaymentType)
  @IsOptional()
  repaymentType?: RepaymentType;

  @ApiPropertyOptional({ description: 'Mode of payment', example: 'Cash' })
  @IsString()
  @IsOptional()
  modeOfPayment?: string;

  @ApiPropertyOptional({ description: 'Reference number', example: 'REF-12345' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'Prepayment charges',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        charge: { type: 'string', description: 'Charge code/item reference' },
        amount: { type: 'number', description: 'Charge amount', minimum: 0 },
      },
    },
    example: [{ charge: 'PREPAY-001', amount: 500 }],
  })
  @IsOptional()
  prepaymentCharges?: Array<{ charge?: string; amount: number }>;

  @ApiPropertyOptional({ description: 'Payment currency ID (if different from loan currency)' })
  @IsString()
  @IsOptional()
  paymentCurrencyId?: string;
}

