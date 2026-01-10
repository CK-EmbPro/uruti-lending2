import { IsDateString, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NpaReportDto {
  @ApiPropertyOptional({ description: 'As on date (ISO 8601)', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  asOnDate?: string;

  @ApiPropertyOptional({ description: 'Company ID', example: 'company-uuid' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Include only NPA loans', example: true })
  @IsBoolean()
  @IsOptional()
  npaOnly?: boolean;

  @ApiPropertyOptional({ description: 'Classification code', example: 'Sub Standard' })
  @IsString()
  @IsOptional()
  classificationCode?: string;
}

