import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutopayStatus, AutopayAmountType } from '../entities/autopay-enrollment.entity';

export class CreateAutopayEnrollmentDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Amount type', enum: AutopayAmountType })
  @IsEnum(AutopayAmountType)
  amountType: AutopayAmountType;

  @ApiPropertyOptional({ description: 'Fixed amount (if amountType is FIXED_AMOUNT)', example: 500.00 })
  @IsNumber()
  @IsOptional()
  fixedAmount?: number;

  @ApiProperty({ description: 'Bank account number (last 4 digits)', example: '1234' })
  @IsString()
  bankAccountNumber: string;

  @ApiProperty({ description: 'Bank routing number', example: '123456789' })
  @IsString()
  bankRoutingNumber: string;

  @ApiProperty({ description: 'Bank account type', example: 'Checking' })
  @IsString()
  bankAccountType: string;

  @ApiProperty({ description: 'Bank name', example: 'Chase Bank' })
  @IsString()
  bankName: string;

  @ApiProperty({ description: 'Account holder name', example: 'John Doe' })
  @IsString()
  accountHolderName: string;
}

export class UpdateAutopayEnrollmentDto {
  @ApiPropertyOptional({ description: 'Autopay status', enum: AutopayStatus })
  @IsEnum(AutopayStatus)
  @IsOptional()
  status?: AutopayStatus;

  @ApiPropertyOptional({ description: 'Amount type', enum: AutopayAmountType })
  @IsEnum(AutopayAmountType)
  @IsOptional()
  amountType?: AutopayAmountType;

  @ApiPropertyOptional({ description: 'Fixed amount' })
  @IsNumber()
  @IsOptional()
  fixedAmount?: number;
}

export class CancelAutopayDto {
  @ApiProperty({ description: 'Cancellation reason', example: 'Borrower requested cancellation' })
  @IsString()
  cancellationReason: string;
}

