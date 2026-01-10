import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialPaymentStatus } from '../entities/partial-payment.entity';

export class CreatePartialPaymentDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Payment amount', example: 200.00 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Required amount (full amount due)', example: 485.66 })
  @IsNumber()
  requiredAmount: number;

  @ApiProperty({ description: 'Payment date', example: '2024-03-15' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ description: 'Mode of payment', example: 'ACH' })
  @IsString()
  @IsOptional()
  modeOfPayment?: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Assess late fee', default: false })
  @IsBoolean()
  @IsOptional()
  assessLateFee?: boolean;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ApplyPartialPaymentDto {
  @ApiProperty({ description: 'Partial payment ID', example: 'uuid-partial-1' })
  @IsString()
  partialPaymentId: string;

  @ApiPropertyOptional({ description: 'Apply immediately with late fee', default: false })
  @IsBoolean()
  @IsOptional()
  applyWithLateFee?: boolean;
}

