import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { SearchEntityType } from '../../../common/enums/search-entity-type.enum';

export class SearchDto {
  @ApiProperty({ description: 'Search query text', example: 'loan 12345' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: SearchEntityType,
    description: 'Entity type to search (default: All)',
  })
  @IsEnum(SearchEntityType)
  @IsOptional()
  type?: SearchEntityType;

  @ApiPropertyOptional({
    description: 'Advanced filters (JSON object)',
    example: { status: 'Active', minAmount: 1000, maxAmount: 10000 },
  })
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: 'Sort order', default: 'DESC' })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Results per page', minimum: 1, maximum: 100, default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Save to search history', default: true })
  @IsBoolean()
  @IsOptional()
  saveToHistory?: boolean;
}

export class SearchResultDto {
  @ApiProperty({ description: 'Entity type' })
  entityType: SearchEntityType;

  @ApiProperty({ description: 'Entity ID' })
  id: string;

  @ApiProperty({ description: 'Entity title/name' })
  title: string;

  @ApiProperty({ description: 'Entity description/summary' })
  description: string;

  @ApiProperty({ description: 'Relevance score (0-1)' })
  score: number;

  @ApiProperty({ description: 'Entity data' })
  data: Record<string, any>;

  @ApiProperty({ description: 'Highlighted matches' })
  highlights: string[];
}

export class SearchResponseDto {
  @ApiProperty({ type: [SearchResultDto], description: 'Search results' })
  results: SearchResultDto[];

  @ApiProperty({ description: 'Total number of results' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Results per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Search query' })
  query?: string;

  @ApiProperty({ description: 'Entity type searched' })
  entityType?: SearchEntityType;
}

