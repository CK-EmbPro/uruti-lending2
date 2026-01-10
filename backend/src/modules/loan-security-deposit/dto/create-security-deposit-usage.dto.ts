import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SecurityDepositUsageType } from '../entities/loan-security-deposit-usage.entity';

export class CreateSecurityDepositUsageDto {
  @ApiProperty({
    description: 'Loan ID',
    example: 'loan-uuid',
  })
  @IsString()
  loanId: string;

  @ApiProperty({
    description: 'Usage type',
    enum: SecurityDepositUsageType,
  })
  @IsEnum(SecurityDepositUsageType)
  usageType: SecurityDepositUsageType;

  @ApiProperty({
    description: 'Amount to use',
    example: 1000,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Usage date',
    example: '2024-01-15',
  })
  @IsDateString()
  usageDate: string;

  @ApiPropertyOptional({
    description: 'Reference document type',
    example: 'Loan Repayment',
  })
  @IsOptional()
  @IsString()
  referenceDocumentType?: string;

  @ApiPropertyOptional({
    description: 'Reference document ID',
    example: 'repayment-uuid',
  })
  @IsOptional()
  @IsString()
  referenceDocumentId?: string;

  @ApiPropertyOptional({
    description: 'Reference number',
    example: 'REF-001',
  })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'Remarks',
    example: 'Used for interest payment',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'User ID who used the deposit',
    example: 'user-uuid',
  })
  @IsOptional()
  @IsString()
  usedBy?: string;

  // Internal fields (set by service)
  balanceBefore?: number;
  balanceAfter?: number;
}

