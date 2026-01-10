import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export enum SearchEntityType {
  LOAN = 'LOAN',
  LOAN_APPLICATION = 'LOAN_APPLICATION',
  CUSTOMER = 'CUSTOMER',
  REPAYMENT = 'REPAYMENT',
  DOCUMENT = 'DOCUMENT',
  ALL = 'ALL',
}

export class AdvancedSearchDto {
  @ApiProperty({ description: 'Search query', example: 'loan application 100000' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Entity types to search', type: [String], enum: SearchEntityType })
  @IsOptional()
  @IsArray()
  @IsEnum(SearchEntityType, { each: true })
  entityTypes?: SearchEntityType[];

  @ApiPropertyOptional({ description: 'Filters', type: Object })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Results per page', example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Save search', default: false })
  @IsOptional()
  @IsBoolean()
  saveSearch?: boolean;

  @ApiPropertyOptional({ description: 'Search name (if saving)', example: 'High-value loans' })
  @IsOptional()
  @IsString()
  searchName?: string;
}

export class SearchResult {
  @ApiProperty({ description: 'Results', type: [Object] })
  results: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    relevanceScore: number;
    metadata: Record<string, any>;
  }>;

  @ApiProperty({ description: 'Total results', example: 150 })
  total: number;

  @ApiProperty({ description: 'Page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Results per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 8 })
  totalPages: number;

  @ApiProperty({ description: 'Search suggestions', type: [String] })
  suggestions: string[];

  @ApiProperty({ description: 'Search ID (if saved)', example: 'uuid' })
  searchId?: string;
}

export class SavedSearch {
  @ApiProperty({ description: 'Search ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Search name', example: 'High-value loans' })
  name: string;

  @ApiProperty({ description: 'Search query', example: 'loan amount > 100000' })
  query: string;

  @ApiProperty({ description: 'Entity types', type: [String] })
  entityTypes: string[];

  @ApiProperty({ description: 'Filters', type: Object })
  filters: Record<string, any>;

  @ApiProperty({ description: 'Result count', example: 25 })
  resultCount: number;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;
}

