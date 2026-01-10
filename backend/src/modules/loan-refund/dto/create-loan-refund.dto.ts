import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLoanRefundDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Posting date (ISO 8601)', example: '2024-12-01' })
  @IsDateString()
  postingDate: string;

  @ApiProperty({ description: 'Value date (ISO 8601)', example: '2024-12-01' })
  @IsDateString()
  valueDate: string;

  @ApiProperty({ description: 'Refund amount', example: 5000.0 })
  @IsNumber()
  @Min(0)
  refundAmount: number;

  @ApiProperty({ description: 'Refund account' })
  @IsString()
  refundAccount: string;

  @ApiPropertyOptional({ description: 'Cost center' })
  @IsString()
  @IsOptional()
  costCenter?: string;

  @ApiPropertyOptional({ description: 'Is excess amount refund', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isExcessAmountRefund?: boolean;

  @ApiPropertyOptional({ description: 'Is security amount refund', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isSecurityAmountRefund?: boolean;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;
}

