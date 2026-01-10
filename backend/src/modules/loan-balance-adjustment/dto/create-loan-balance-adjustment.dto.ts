import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdjustmentType, ReferenceDocumentType } from '../entities/loan-balance-adjustment.entity';

export class CreateLoanBalanceAdjustmentDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Posting date (ISO 8601)', example: '2024-12-01' })
  @IsDateString()
  postingDate: string;

  @ApiProperty({
    description: 'Adjustment type',
    enum: AdjustmentType,
    example: AdjustmentType.CREDIT_ADJUSTMENT,
  })
  @IsEnum(AdjustmentType)
  adjustmentType: AdjustmentType;

  @ApiProperty({ description: 'Adjustment amount', example: 1000.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Adjustment account' })
  @IsString()
  adjustmentAccount: string;

  @ApiPropertyOptional({ description: 'Adjustment receivable account' })
  @IsString()
  @IsOptional()
  adjustmentReceivableAccount?: string;

  @ApiPropertyOptional({ description: 'Cost center' })
  @IsString()
  @IsOptional()
  costCenter?: string;

  @ApiPropertyOptional({
    description: 'Reference document type',
    enum: ReferenceDocumentType,
  })
  @IsEnum(ReferenceDocumentType)
  @IsOptional()
  referenceDocumentType?: ReferenceDocumentType;

  @ApiPropertyOptional({ description: 'Reference document name' })
  @IsString()
  @IsOptional()
  referenceName?: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

