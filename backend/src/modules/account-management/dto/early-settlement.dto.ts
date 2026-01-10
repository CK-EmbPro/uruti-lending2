import { IsString, IsOptional, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerSegment } from '../entities/early-settlement-analytics.entity';

export class CalculateDailyPayoffDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiPropertyOptional({ description: 'Calculation date (defaults to today)', example: '2024-03-15' })
  @IsDateString()
  @IsOptional()
  calculationDate?: string;
}

export class CalculateDailyPayoffsRangeDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Start date', example: '2024-03-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date', example: '2024-03-22' })
  @IsDateString()
  endDate: string;
}

export class GetAnalyticsDto {
  @ApiPropertyOptional({ description: 'Customer segment', enum: CustomerSegment })
  @IsEnum(CustomerSegment)
  @IsOptional()
  segment?: CustomerSegment;

  @ApiPropertyOptional({ description: 'Period start date', example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  periodStart?: string;

  @ApiPropertyOptional({ description: 'Period end date', example: '2024-03-31' })
  @IsDateString()
  @IsOptional()
  periodEnd?: string;
}

export class GenerateAnalyticsDto {
  @ApiProperty({ description: 'Period start date', example: '2024-01-01' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: 'Period end date', example: '2024-03-31' })
  @IsDateString()
  periodEnd: string;
}

