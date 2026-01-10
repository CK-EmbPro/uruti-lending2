import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReversalReason, ReversalStatus } from '../entities/payment-reversal.entity';

export class CreatePaymentReversalDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Repayment ID to reverse', example: 'uuid-repayment-1' })
  @IsString()
  repaymentId: string;

  @ApiProperty({ description: 'Reversal reason', enum: ReversalReason })
  @IsEnum(ReversalReason)
  reason: ReversalReason;

  @ApiProperty({ description: 'Reversal amount', example: 485.66 })
  @IsNumber()
  reversalAmount: number;

  @ApiPropertyOptional({ description: 'NSF fee (if applicable)', example: 25.00 })
  @IsNumber()
  @IsOptional()
  nsfFee?: number;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Notify borrower', default: true })
  @IsBoolean()
  @IsOptional()
  notifyBorrower?: boolean;

  @ApiPropertyOptional({ description: 'Initiate collection', default: false })
  @IsBoolean()
  @IsOptional()
  initiateCollection?: boolean;
}

export class UpdatePaymentReversalDto {
  @ApiPropertyOptional({ description: 'Reversal status', enum: ReversalStatus })
  @IsEnum(ReversalStatus)
  @IsOptional()
  status?: ReversalStatus;

  @ApiPropertyOptional({ description: 'Borrower notified' })
  @IsBoolean()
  @IsOptional()
  borrowerNotified?: boolean;

  @ApiPropertyOptional({ description: 'Collection initiated' })
  @IsBoolean()
  @IsOptional()
  collectionInitiated?: boolean;
}

