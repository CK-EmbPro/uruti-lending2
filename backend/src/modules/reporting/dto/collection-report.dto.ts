import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CollectionReportDto {
  @ApiProperty({ description: 'From date (ISO 8601)', example: '2024-01-01' })
  @IsDateString()
  fromDate: string;

  @ApiProperty({ description: 'To date (ISO 8601)', example: '2024-12-31' })
  @IsDateString()
  toDate: string;

  @ApiPropertyOptional({ description: 'Company ID', example: 'company-uuid' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Loan product ID', example: 'product-uuid' })
  @IsString()
  @IsOptional()
  loanProductId?: string;
}

