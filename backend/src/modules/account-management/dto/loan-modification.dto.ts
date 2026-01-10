import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModificationType } from '../entities/loan-modification.entity';

export class CreateLoanModificationDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Modification type', enum: ModificationType })
  @IsEnum(ModificationType)
  modificationType: ModificationType;

  @ApiProperty({ description: 'Reason for modification', example: 'Financial hardship due to job loss' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'New interest rate (for rate reduction)', example: 5.5 })
  @IsNumber()
  @IsOptional()
  newInterestRate?: number;

  @ApiPropertyOptional({ description: 'New term in months (for term extension)', example: 60 })
  @IsNumber()
  @IsOptional()
  newTermMonths?: number;

  @ApiPropertyOptional({ description: 'Payment holiday months (for payment holiday)', example: 3 })
  @IsNumber()
  @IsOptional()
  paymentHolidayMonths?: number;

  @ApiPropertyOptional({ description: 'New payment amount (for payment reduction)', example: 300.00 })
  @IsNumber()
  @IsOptional()
  newPaymentAmount?: number;

  @ApiPropertyOptional({ description: 'Hardship documentation path' })
  @IsString()
  @IsOptional()
  hardshipDocumentation?: string;
}

export class ReviewModificationDto {
  @ApiPropertyOptional({ description: 'Review notes' })
  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class ExecuteModificationDto {
  @ApiPropertyOptional({ description: 'Modification agreement path' })
  @IsString()
  @IsOptional()
  modificationAgreement?: string;
}














