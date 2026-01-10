import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum RepaymentMethod {
  DIRECT_DEBIT = 'DIRECT_DEBIT',
  MOBILE_MONEY_AUTO_DEBIT = 'MOBILE_MONEY_AUTO_DEBIT',
  CARD_AUTO_CHARGE = 'CARD_AUTO_CHARGE',
  MANUAL_TRANSFER = 'MANUAL_TRANSFER',
}

export enum PaymentScenario {
  EXACT = 'EXACT',
  PARTIAL = 'PARTIAL',
  OVER = 'OVER',
  UNDER = 'UNDER',
}

export enum ReconciliationStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  FAILED = 'FAILED',
}

export class PaymentDetailsDto {
  @ApiProperty({ description: 'Payment method', enum: RepaymentMethod })
  @IsEnum(RepaymentMethod)
  method: RepaymentMethod;

  @ApiPropertyOptional({ description: 'Reference number (for manual transfers)' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Account number or card number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  @IsOptional()
  @IsString()
  externalTransactionId?: string;
}

export class AutoRepaymentRequestDto {
  @ApiProperty({ description: 'Loan ID' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Payment details' })
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails: PaymentDetailsDto;

  @ApiPropertyOptional({ description: 'Payment date (defaults to today)' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}

export class ReconciliationResultDto {
  @ApiProperty({ description: 'Reconciliation status', enum: ReconciliationStatus })
  status: ReconciliationStatus;

  @ApiProperty({ description: 'Time to reconciliation (milliseconds)' })
  reconciliationTimeMs: number;

  @ApiPropertyOptional({ description: 'Matched repayment ID' })
  matchedRepaymentId?: string;

  @ApiPropertyOptional({ description: 'Reconciliation timestamp' })
  reconciledAt?: Date;
}

export class AutoRepaymentResultDto {
  @ApiProperty({ description: 'Repayment ID' })
  id: string;

  @ApiProperty({ description: 'Loan ID' })
  loanId: string;

  @ApiProperty({ description: 'Payment amount' })
  amount: number;

  @ApiProperty({ description: 'Payment scenario', enum: PaymentScenario })
  scenario: PaymentScenario;

  @ApiProperty({ description: 'Payment method', enum: RepaymentMethod })
  method: RepaymentMethod;

  @ApiProperty({ description: 'Reconciliation result' })
  @ValidateNested()
  @Type(() => ReconciliationResultDto)
  reconciliation: ReconciliationResultDto;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;
}

