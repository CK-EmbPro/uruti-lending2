import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsArray, Min, Max } from 'class-validator';

export enum RateLimitStrategy {
  FIXED_WINDOW = 'FIXED_WINDOW',
  SLIDING_WINDOW = 'SLIDING_WINDOW',
  TOKEN_BUCKET = 'TOKEN_BUCKET',
}

export enum CacheStrategy {
  NO_CACHE = 'NO_CACHE',
  CACHE_FIRST = 'CACHE_FIRST',
  NETWORK_FIRST = 'NETWORK_FIRST',
  CACHE_ONLY = 'CACHE_ONLY',
}

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export class CreateApiRouteDto {
  @ApiProperty({ description: 'Route path', example: '/api/loans' })
  @IsString()
  routePath: string;

  @ApiProperty({ description: 'Target service', example: 'loan-service' })
  @IsString()
  targetService: string;

  @ApiProperty({ description: 'Target URL', example: 'http://loan-service:3000' })
  @IsString()
  targetUrl: string;

  @ApiPropertyOptional({ description: 'HTTP methods', type: [String], example: ['GET', 'POST'] })
  @IsOptional()
  @IsArray()
  methods?: RequestMethod[];

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateRateLimitRuleDto {
  @ApiProperty({ description: 'Route path pattern', example: '/api/loans/*' })
  @IsString()
  routePattern: string;

  @ApiProperty({ description: 'Max requests', example: 100 })
  @IsNumber()
  @Min(1)
  maxRequests: number;

  @ApiProperty({ description: 'Time window (seconds)', example: 60 })
  @IsNumber()
  @Min(1)
  timeWindow: number;

  @ApiProperty({ description: 'Rate limit strategy', enum: RateLimitStrategy })
  @IsEnum(RateLimitStrategy)
  strategy: RateLimitStrategy;
}

export class ApiRoute {
  @ApiProperty({ description: 'Route ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Route path' })
  routePath: string;

  @ApiProperty({ description: 'Target service' })
  targetService: string;

  @ApiProperty({ description: 'Target URL' })
  targetUrl: string;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Request count', example: 1250 })
  requestCount: number;

  @ApiProperty({ description: 'Error count', example: 15 })
  errorCount: number;
}

export class ApiGatewayStats {
  @ApiProperty({ description: 'Total requests', example: 100000 })
  totalRequests: number;

  @ApiProperty({ description: 'Requests per minute', example: 150 })
  requestsPerMinute: number;

  @ApiProperty({ description: 'Average response time (ms)', example: 125 })
  averageResponseTime: number;

  @ApiProperty({ description: 'Error rate', example: 0.5 })
  errorRate: number;

  @ApiProperty({ description: 'Active routes', example: 25 })
  activeRoutes: number;
}

