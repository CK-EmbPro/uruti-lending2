import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsNumber, IsArray } from 'class-validator';

export class ElasticsearchIndexDto {
  @ApiProperty({ description: 'Index name', example: 'loans' })
  @IsString()
  indexName: string;

  @ApiProperty({ description: 'Document ID', example: 'loan-uuid' })
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'Document data', type: Object })
  @IsObject()
  document: Record<string, any>;
}

export class ElasticsearchSearchDto {
  @ApiProperty({ description: 'Index name', example: 'loans' })
  @IsString()
  indexName: string;

  @ApiProperty({ description: 'Search query', example: 'loan application' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Filters', type: Object })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Page', example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Limit', example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort fields', type: [String] })
  @IsOptional()
  @IsArray()
  sort?: string[];
}

export class ElasticsearchBulkIndexDto {
  @ApiProperty({ description: 'Index name', example: 'loans' })
  @IsString()
  indexName: string;

  @ApiProperty({ description: 'Documents', type: [Object] })
  @IsArray()
  documents: Array<{ id: string; data: Record<string, any> }>;
}

