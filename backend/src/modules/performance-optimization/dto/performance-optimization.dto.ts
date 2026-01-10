import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsNumber } from 'class-validator';

export enum PerformanceMetricType {
  RESPONSE_TIME = 'RESPONSE_TIME',
  THROUGHPUT = 'THROUGHPUT',
  ERROR_RATE = 'ERROR_RATE',
  MEMORY_USAGE = 'MEMORY_USAGE',
  CPU_USAGE = 'CPU_USAGE',
  DATABASE_QUERY_TIME = 'DATABASE_QUERY_TIME',
}

export enum OptimizationStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  OPTIMIZED = 'OPTIMIZED',
  FAILED = 'FAILED',
}

export class PerformanceProfileDto {
  @ApiProperty({ description: 'Endpoint', example: '/api/loans' })
  @IsString()
  endpoint: string;

  @ApiProperty({ description: 'Method', example: 'GET' })
  @IsString()
  method: string;

  @ApiPropertyOptional({ description: 'Duration (seconds)', example: 60 })
  @IsOptional()
  @IsNumber()
  duration?: number;
}

export class OptimizationRecommendation {
  @ApiProperty({ description: 'Recommendation ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Type', example: 'ADD_CACHE' })
  type: string;

  @ApiProperty({ description: 'Description', example: 'Add caching to improve response time' })
  description: string;

  @ApiProperty({ description: 'Impact', example: 'HIGH' })
  impact: string;

  @ApiProperty({ description: 'Estimated improvement', example: '50%' })
  estimatedImprovement: string;
}

