import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VoucherType } from '../entities/journal-entry.entity';

export class CreateGlEntryDto {
  @ApiProperty({ description: 'Account code/ID', example: 'ACC-001' })
  @IsString()
  account: string;

  @ApiPropertyOptional({ description: 'Account name', example: 'Loan Account' })
  @IsString()
  @IsOptional()
  accountName?: string;

  @ApiPropertyOptional({ description: 'Against account', example: 'BANK-001' })
  @IsString()
  @IsOptional()
  againstAccount?: string;

  @ApiProperty({ description: 'Debit amount', example: 100000, minimum: 0 })
  @IsNumber()
  @Min(0)
  debit: number;

  @ApiProperty({ description: 'Credit amount', example: 0, minimum: 0 })
  @IsNumber()
  @Min(0)
  credit: number;

  @ApiPropertyOptional({ description: 'Party type', example: 'Customer' })
  @IsString()
  @IsOptional()
  partyType?: string;

  @ApiPropertyOptional({ description: 'Party ID', example: 'CUST-001' })
  @IsString()
  @IsOptional()
  party?: string;

  @ApiPropertyOptional({ description: 'Cost center', example: 'CC-001' })
  @IsString()
  @IsOptional()
  costCenter?: string;

  @ApiPropertyOptional({ description: 'Remarks', example: 'Loan disbursement' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({
    description: 'Voucher type',
    enum: VoucherType,
    example: VoucherType.JOURNAL_ENTRY,
  })
  @IsEnum(VoucherType)
  voucherType: VoucherType;

  @ApiProperty({ description: 'Company ID', example: 'company-uuid' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Posting date (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  postingDate: string;

  @ApiProperty({ description: 'Value date (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  valueDate: string;

  @ApiProperty({ description: 'GL Entries', type: [CreateGlEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGlEntryDto)
  glEntries: CreateGlEntryDto[];

  @ApiPropertyOptional({ description: 'Remarks', example: 'Loan disbursement entry' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Reference type', example: 'Loan' })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Reference ID', example: 'loan-uuid' })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Cost center', example: 'CC-001' })
  @IsString()
  @IsOptional()
  costCenter?: string;
}

