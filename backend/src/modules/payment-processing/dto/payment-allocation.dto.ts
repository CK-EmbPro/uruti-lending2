import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AllocationPreference } from '../entities/payment-allocation.entity';

export class CreatePaymentAllocationDto {
  @ApiProperty({ description: 'Repayment ID', example: 'uuid-repayment-1' })
  @IsString()
  repaymentId: string;

  @ApiProperty({ description: 'Total payment amount', example: 500.00 })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ description: 'Allocation preference', enum: AllocationPreference })
  @IsEnum(AllocationPreference)
  allocationPreference: AllocationPreference;

  @ApiPropertyOptional({ description: 'Is early payment', default: false })
  @IsBoolean()
  @IsOptional()
  isEarlyPayment?: boolean;

  @ApiPropertyOptional({ description: 'Is extra payment', default: false })
  @IsBoolean()
  @IsOptional()
  isExtraPayment?: boolean;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

