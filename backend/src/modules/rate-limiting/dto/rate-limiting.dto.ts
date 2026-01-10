import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsObject } from 'class-validator';

export enum RateLimitStrategy {
  FIXED_WINDOW = 'FIXED_WINDOW',
  SLIDING_WINDOW = 'SLIDING_WINDOW',
  TOKEN_BUCKET = 'TOKEN_BUCKET',
  LEAKY_BUCKET = 'LEAKY_BUCKET',
}

export enum RateLimitScope {
  USER = 'USER',
  IP = 'IP',
  API_KEY = 'API_KEY',
  GLOBAL = 'GLOBAL',
}

export class CreateRateLimitRuleDto {
  @ApiProperty({ description: 'Rule name', example: 'API Rate Limit' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Endpoint pattern', example: '/api/loans/*' })
  @IsString()
  endpointPattern: string;

  @ApiProperty({ description: 'Max requests', example: 100 })
  @IsNumber()
  maxRequests: number;

  @ApiProperty({ description: 'Time window (seconds)', example: 60 })
  @IsNumber()
  timeWindow: number;

  @ApiProperty({ description: 'Strategy', enum: RateLimitStrategy })
  @IsEnum(RateLimitStrategy)
  strategy: RateLimitStrategy;

  @ApiProperty({ description: 'Scope', enum: RateLimitScope })
  @IsEnum(RateLimitScope)
  scope: RateLimitScope;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RateLimitStats {
  @ApiProperty({ description: 'Total requests', example: 1500 })
  totalRequests: number;

  @ApiProperty({ description: 'Allowed requests', example: 1400 })
  allowedRequests: number;

  @ApiProperty({ description: 'Blocked requests', example: 100 })
  blockedRequests: number;

  @ApiProperty({ description: 'Block rate', example: 0.067 })
  blockRate: number;

  @ApiProperty({ description: 'Top blocked IPs', type: [Object] })
  topBlockedIPs: Array<{ ip: string; count: number }>;

  @ApiProperty({ description: 'Top blocked users', type: [Object] })
  topBlockedUsers: Array<{ userId: string; count: number }>;
}

