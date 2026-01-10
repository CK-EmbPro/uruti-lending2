import { IsDateString, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum SegmentType {
  PRODUCT = 'PRODUCT',
  STATUS = 'STATUS',
  DELINQUENCY_STAGE = 'DELINQUENCY_STAGE',
  GEOGRAPHY = 'GEOGRAPHY',
}

export class PortfolioPerformanceDto {
  @ApiPropertyOptional({ description: 'From date (ISO 8601)', example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date (ISO 8601)', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Loan Product ID' })
  @IsString()
  @IsOptional()
  loanProductId?: string;

  @ApiPropertyOptional({
    description: 'Segment type for drill-down',
    enum: SegmentType,
    example: SegmentType.PRODUCT,
  })
  @IsEnum(SegmentType)
  @IsOptional()
  segmentType?: SegmentType;

  @ApiPropertyOptional({ description: 'Include trends', default: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (value === 'true' || value === true || value === '1') return true;
    if (value === 'false' || value === false || value === '0') return false;
    return Boolean(value);
  })
  @IsBoolean()
  includeTrends?: boolean;
}

