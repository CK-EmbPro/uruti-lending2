import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString, IsNumber, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus } from '../entities/loan-application.entity';

export class QueryLoanApplicationsDto {
  @ApiPropertyOptional({
    description: 'Filter by application status',
    enum: ApplicationStatus,
    example: ApplicationStatus.SUBMITTED,
  })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Filter by applicant type',
    example: 'Customer',
  })
  @IsString()
  @IsOptional()
  applicantType?: string;

  @ApiPropertyOptional({
    description: 'Filter by applicant ID',
    example: 'customer-uuid',
  })
  @IsString()
  @IsOptional()
  applicantId?: string;

  @ApiPropertyOptional({
    description: 'Filter by loan product ID',
    example: 'product-uuid',
  })
  @IsString()
  @IsOptional()
  loanProductId?: string;

  @ApiPropertyOptional({
    description: 'Minimum requested amount',
    example: 10000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum requested amount',
    example: 100000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Filter by application date from (ISO 8601)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by application date to (ISO 8601)',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Search term (searches in application number, applicant ID, remarks)',
    example: 'APP-2024',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'applicationDate', 'requestedAmount', 'status', 'applicationNumber'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'applicationDate' | 'requestedAmount' | 'status' | 'applicationNumber';

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

export class PaginatedLoanApplicationsResponse {
  @ApiProperty({ description: 'List of loan applications', type: [Object] })
  data: any[];

  @ApiProperty({ description: 'Total number of applications' })
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

