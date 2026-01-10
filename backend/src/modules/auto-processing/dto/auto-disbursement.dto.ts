import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum DisbursementMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

export enum DisbursementStatus {
  PENDING = 'PENDING',
  VERIFYING = 'VERIFYING',
  VERIFIED = 'VERIFIED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  HELD_FOR_REVIEW = 'HELD_FOR_REVIEW',
  CANCELLED = 'CANCELLED',
}

export enum AccountVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  REQUIRES_REVIEW = 'REQUIRES_REVIEW',
}

export class AccountDetailsDto {
  @ApiProperty({ description: 'Account number or mobile money number' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsString()
  accountHolderName: string;

  @ApiPropertyOptional({ description: 'Bank name (for bank transfers)' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Bank code or routing number' })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiProperty({ description: 'Disbursement method', enum: DisbursementMethod })
  @IsEnum(DisbursementMethod)
  method: DisbursementMethod;
}

export class AutoDisbursementRequestDto {
  @ApiProperty({ description: 'Loan ID' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Account details for disbursement' })
  @ValidateNested()
  @Type(() => AccountDetailsDto)
  accountDetails: AccountDetailsDto;

  @ApiPropertyOptional({ description: 'Disbursement amount (defaults to full loan amount)' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Skip account verification (for testing)' })
  @IsOptional()
  @IsBoolean()
  skipVerification?: boolean;
}

export class DisbursementAttemptDto {
  @ApiProperty({ description: 'Attempt number (1-3)' })
  attemptNumber: number;

  @ApiProperty({ description: 'Attempt timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  errorMessage?: string;

  @ApiPropertyOptional({ description: 'External transaction reference' })
  externalReference?: string;
}

export class AutoDisbursementResultDto {
  @ApiProperty({ description: 'Disbursement ID' })
  id: string;

  @ApiProperty({ description: 'Loan ID' })
  loanId: string;

  @ApiProperty({ description: 'Disbursement status', enum: DisbursementStatus })
  status: DisbursementStatus;

  @ApiProperty({ description: 'Account verification status', enum: AccountVerificationStatus })
  accountVerificationStatus: AccountVerificationStatus;

  @ApiProperty({ description: 'Disbursement method', enum: DisbursementMethod })
  method: DisbursementMethod;

  @ApiProperty({ description: 'Disbursement amount' })
  amount: number;

  @ApiProperty({ description: 'Time from approval to disbursement (milliseconds)' })
  processingTimeMs: number;

  @ApiProperty({ description: 'Number of attempts made' })
  attemptCount: number;

  @ApiProperty({ description: 'List of disbursement attempts' })
  attempts: DisbursementAttemptDto[];

  @ApiPropertyOptional({ description: 'External transaction reference' })
  externalReference?: string;

  @ApiPropertyOptional({ description: 'Reason for failure or hold' })
  failureReason?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;
}

