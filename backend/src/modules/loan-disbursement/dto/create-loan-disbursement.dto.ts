import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLoanDisbursementDto {
  @ApiProperty({ description: 'Loan ID', example: 'loan-uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Disbursement date (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  disbursementDate: string;

  @ApiProperty({ description: 'Disbursed amount', example: 100000, minimum: 0 })
  @IsNumber()
  @Min(0)
  disbursedAmount: number;

  @ApiPropertyOptional({ description: 'Reference number', example: 'DISB-12345' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Mode of payment', example: 'Bank Transfer' })
  @IsString()
  @IsOptional()
  modeOfPayment?: string;

  @ApiPropertyOptional({ description: 'Currency ID for disbursement (if different from loan currency)' })
  @IsString()
  @IsOptional()
  currencyId?: string;
}

