import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';

export enum DocumentationStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
}

export class CreateAPIDocumentationDto {
  @ApiProperty({ description: 'API endpoint', example: '/api/loans' })
  @IsString()
  endpoint: string;

  @ApiProperty({ description: 'HTTP method', example: 'GET' })
  @IsString()
  method: string;

  @ApiProperty({ description: 'Title', example: 'Get Loans' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Retrieve list of loans' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Request example', type: Object })
  @IsOptional()
  @IsObject()
  requestExample?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Response example', type: Object })
  @IsOptional()
  @IsObject()
  responseExample?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Parameters', type: [Object] })
  @IsOptional()
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
}

export class TestAPIDto {
  @ApiProperty({ description: 'Endpoint', example: '/api/loans' })
  @IsString()
  endpoint: string;

  @ApiProperty({ description: 'Method', example: 'GET' })
  @IsString()
  method: string;

  @ApiPropertyOptional({ description: 'Request data', type: Object })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Headers', type: Object })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;
}

