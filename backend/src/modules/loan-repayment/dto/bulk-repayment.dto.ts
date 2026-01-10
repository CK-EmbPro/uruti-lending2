import {
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RepaymentType } from '../../../common/enums/repayment-type.enum';

export class BulkRepaymentItemDto {
  @ApiProperty({ description: 'Loan ID', example: 'loan-uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Amount paid', example: 50000, minimum: 0 })
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @ApiPropertyOptional({ description: 'Principal paid', example: 40000, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  principalPaid?: number;

  @ApiPropertyOptional({ description: 'Interest paid', example: 8000, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  interestPaid?: number;

  @ApiPropertyOptional({ description: 'Penalty paid', example: 2000, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  penaltyPaid?: number;

  @ApiPropertyOptional({ description: 'Charges paid', example: 0, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  chargesPaid?: number;

  @ApiPropertyOptional({ description: 'Repayment type', enum: RepaymentType, example: RepaymentType.NORMAL_REPAYMENT })
  @IsOptional()
  repaymentType?: RepaymentType;
}

export class BulkRepaymentDto {
  @ApiProperty({ description: 'Posting date (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  postingDate: string;

  @ApiProperty({ description: 'Value date (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  valueDate: string;

  @ApiProperty({ description: 'Array of repayment items', type: [BulkRepaymentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkRepaymentItemDto)
  repayments: BulkRepaymentItemDto[];

  @ApiPropertyOptional({ description: 'Reference number', example: 'BULK-REP-2024-001' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Mode of payment', example: 'Bank Transfer' })
  @IsString()
  @IsOptional()
  modeOfPayment?: string;
}

