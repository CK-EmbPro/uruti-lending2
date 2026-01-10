import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PortfolioReportDto {
  @ApiPropertyOptional({ description: 'From date (ISO 8601)', example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date (ISO 8601)', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Company ID', example: 'company-uuid' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Loan product ID', example: 'product-uuid' })
  @IsString()
  @IsOptional()
  loanProductId?: string;
}

