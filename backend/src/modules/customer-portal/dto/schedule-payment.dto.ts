import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsEnum, IsOptional, Min, Max } from 'class-validator';

export enum PaymentAmountType {
  MINIMUM = 'MINIMUM',
  FULL_BALANCE = 'FULL_BALANCE',
  CUSTOM = 'CUSTOM',
  NEXT_INSTALLMENT = 'NEXT_INSTALLMENT',
}

export enum PaymentMethod {
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
}

export class SchedulePaymentDto {
  @ApiProperty({ description: 'Loan ID' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Payment amount type', enum: PaymentAmountType })
  @IsEnum(PaymentAmountType)
  amountType: PaymentAmountType;

  @ApiPropertyOptional({ description: 'Custom payment amount (required if amountType is CUSTOM)', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  customAmount?: number;

  @ApiProperty({ description: 'Scheduled payment date (ISO string)' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment method ID (if already saved)' })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({ description: 'Bank account last 4 digits (for new bank account)' })
  @IsString()
  @IsOptional()
  bankAccountLast4?: string;

  @ApiPropertyOptional({ description: 'Bank routing number (for new bank account)' })
  @IsString()
  @IsOptional()
  bankRoutingNumber?: string;

  @ApiPropertyOptional({ description: 'Card last 4 digits (for new card)' })
  @IsString()
  @IsOptional()
  cardLast4?: string;

  @ApiPropertyOptional({ description: 'Notes or memo' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CancelScheduledPaymentDto {
  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsString()
  @IsOptional()
  reason?: string;
}

