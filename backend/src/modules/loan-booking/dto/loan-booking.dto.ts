import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../entities/loan-booking.entity';

export class CreateLoanBookingDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Application ID', example: 'uuid-application-1' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'Whether notarization is required', default: false })
  @IsBoolean()
  @IsOptional()
  requiresNotarization?: boolean;

  @ApiPropertyOptional({ description: 'Booking remarks', example: 'Standard booking process' })
  @IsString()
  @IsOptional()
  bookingRemarks?: string;
}

export class UpdateLoanBookingDto {
  @ApiPropertyOptional({ description: 'Booking status', enum: BookingStatus })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Booking remarks' })
  @IsString()
  @IsOptional()
  bookingRemarks?: string;

  @ApiPropertyOptional({ description: 'Account number if created' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Account details' })
  @IsObject()
  @IsOptional()
  accountDetails?: Record<string, any>;
}

export class CancelLoanBookingDto {
  @ApiProperty({ description: 'Cancellation reason', example: 'Borrower requested cancellation' })
  @IsString()
  cancellationReason: string;
}

