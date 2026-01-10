import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RepaymentType } from '../../../common/enums/repayment-type.enum';

export class QueryLoanRepaymentsDto {
  @ApiPropertyOptional({
    description: 'Filter by loan ID',
    example: 'loan-uuid',
  })
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({
    description: 'Filter by repayment type',
    enum: RepaymentType,
    example: RepaymentType.NORMAL_REPAYMENT,
  })
  @IsEnum(RepaymentType)
  @IsOptional()
  repaymentType?: RepaymentType;

  @ApiPropertyOptional({
    description: 'Filter by posting date from (ISO 8601)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by posting date to (ISO 8601)',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Minimum amount paid',
    example: 1000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum amount paid',
    example: 100000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Search term (searches in reference number, mode of payment)',
    example: 'REF-2024',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'postingDate', 'amountPaid', 'repaymentType'],
    default: 'postingDate',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'postingDate' | 'amountPaid' | 'repaymentType';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Results per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class PaginatedLoanRepaymentsResponse {
  @ApiProperty({ description: 'List of loan repayments', type: [Object] })
  data: any[];

  @ApiProperty({ description: 'Total number of repayments' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrevious: boolean;
}

