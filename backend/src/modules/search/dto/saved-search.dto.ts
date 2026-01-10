import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, IsInt, IsBoolean, Min } from 'class-validator';
import { SearchEntityType } from '../../../common/enums/search-entity-type.enum';

export class CreateSavedSearchDto {
  @ApiProperty({ description: 'Search name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Search description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: SearchEntityType,
    description: 'Entity type to search',
  })
  @IsEnum(SearchEntityType)
  @IsOptional()
  entityType?: SearchEntityType;

  @ApiPropertyOptional({ description: 'Search query text' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ description: 'Advanced filters' })
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Sort configuration' })
  @IsObject()
  @IsOptional()
  sortBy?: Record<string, 'ASC' | 'DESC'>;

  @ApiPropertyOptional({ description: 'Results limit', default: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Set as default search', default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateSavedSearchDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  sortBy?: Record<string, 'ASC' | 'DESC'>;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

