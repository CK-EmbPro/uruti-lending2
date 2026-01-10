import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RateLockType } from '../entities/rate-lock.entity';

export class CreateRateLockDto {
  @ApiPropertyOptional({ description: 'Loan ID (if loan already exists)', example: 'uuid-loan-1' })
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({ description: 'Application ID (if locked during application)', example: 'uuid-application-1' })
  @IsString()
  @IsOptional()
  applicationId?: string;

  @ApiProperty({ description: 'Interest rate to lock', example: 7.5, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  lockedRate: number;

  @ApiProperty({ description: 'Lock period in days', example: 30, minimum: 1 })
  @IsInt()
  @Min(1)
  lockPeriodDays: number;

  @ApiPropertyOptional({ description: 'Rate lock type', enum: RateLockType, default: RateLockType.STANDARD })
  @IsEnum(RateLockType)
  @IsOptional()
  lockType?: RateLockType;

  @ApiPropertyOptional({ description: 'Enable automatic extension', default: false })
  @IsBoolean()
  @IsOptional()
  autoExtend?: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of extensions', example: 2, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxExtensions?: number;

  @ApiPropertyOptional({ description: 'Enable float-down option', default: false })
  @IsBoolean()
  @IsOptional()
  floatDownEligible?: boolean;

  @ApiPropertyOptional({ description: 'Float-down rate threshold', example: 0.5, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  floatDownThreshold?: number;

  @ApiPropertyOptional({ description: 'Remarks', example: 'Standard rate lock for 30 days' })
  @IsString()
  @IsOptional()
  approvalRemarks?: string;
}

export class ExtendRateLockDto {
  @ApiProperty({ description: 'Additional days to extend', example: 15, minimum: 1 })
  @IsInt()
  @Min(1)
  additionalDays: number;

  @ApiPropertyOptional({ description: 'Remarks', example: 'Extended due to processing delay' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ExerciseFloatDownDto {
  @ApiProperty({ description: 'New lower rate', example: 7.0, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  newRate: number;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CancelRateLockDto {
  @ApiProperty({ description: 'Cancellation reason', example: 'Borrower requested cancellation' })
  @IsString()
  cancellationReason: string;
}

