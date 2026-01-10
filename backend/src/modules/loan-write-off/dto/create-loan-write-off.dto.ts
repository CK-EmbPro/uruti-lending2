import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLoanWriteOffDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Posting date (ISO 8601)', example: '2024-12-01' })
  @IsDateString()
  postingDate: string;

  @ApiPropertyOptional({ description: 'Value date (ISO 8601)', example: '2024-12-01' })
  @IsDateString()
  @IsOptional()
  valueDate?: string;

  @ApiPropertyOptional({ description: 'Write-off amount (auto-calculated if not provided)', example: 10000.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  writeOffAmount?: number;

  @ApiPropertyOptional({ description: 'Write-off account' })
  @IsString()
  @IsOptional()
  writeOffAccount?: string;

  @ApiPropertyOptional({ description: 'Cost center' })
  @IsString()
  @IsOptional()
  costCenter?: string;

  @ApiPropertyOptional({ description: 'Is NPA write-off', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isNpa?: boolean;

  @ApiPropertyOptional({ description: 'Is settlement write-off', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isSettlementWriteOff?: boolean;

  @ApiPropertyOptional({ description: 'Loan disbursement ID (for LOC loans)' })
  @IsString()
  @IsOptional()
  loanDisbursementId?: string;
}

