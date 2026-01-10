import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsObject } from 'class-validator';

export enum CacheStrategy {
  LRU = 'LRU', // Least Recently Used
  LFU = 'LFU', // Least Frequently Used
  FIFO = 'FIFO', // First In First Out
  TTL = 'TTL', // Time To Live
}

export enum CacheTier {
  MEMORY = 'MEMORY',
  REDIS = 'REDIS',
  DISK = 'DISK',
}

export class CacheConfigDto {
  @ApiProperty({ description: 'Cache key', example: 'loan:123' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Cache value', type: Object })
  @IsObject()
  value: Record<string, any>;

  @ApiPropertyOptional({ description: 'Time to live (seconds)', example: 3600 })
  @IsOptional()
  @IsNumber()
  ttl?: number;

  @ApiPropertyOptional({ description: 'Cache strategy', enum: CacheStrategy, example: CacheStrategy.LRU })
  @IsOptional()
  @IsEnum(CacheStrategy)
  strategy?: CacheStrategy;

  @ApiPropertyOptional({ description: 'Cache tier', enum: CacheTier, example: CacheTier.MEMORY })
  @IsOptional()
  @IsEnum(CacheTier)
  tier?: CacheTier;
}

export class CacheStats {
  @ApiProperty({ description: 'Total keys', example: 1250 })
  totalKeys: number;

  @ApiProperty({ description: 'Cache hits', example: 8500 })
  hits: number;

  @ApiProperty({ description: 'Cache misses', example: 1200 })
  misses: number;

  @ApiProperty({ description: 'Hit rate', example: 0.876 })
  hitRate: number;

  @ApiProperty({ description: 'Memory usage (bytes)', example: 52428800 })
  memoryUsage: number;

  @ApiProperty({ description: 'Evictions', example: 150 })
  evictions: number;
}
