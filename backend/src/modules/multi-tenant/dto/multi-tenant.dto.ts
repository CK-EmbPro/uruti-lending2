import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject, IsArray } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ description: 'Tenant name', example: 'Acme Corporation' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tenant subdomain', example: 'acme' })
  @IsString()
  subdomain: string;

  @ApiPropertyOptional({ description: 'Custom domain', example: 'acme.urutilending.com' })
  @IsOptional()
  @IsString()
  customDomain?: string;

  @ApiPropertyOptional({ description: 'Configuration', type: Object })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class TenantIsolationRule {
  @ApiProperty({ description: 'Rule name', example: 'Data Isolation' })
  name: string;

  @ApiProperty({ description: 'Entity type', example: 'Loan' })
  entityType: string;

  @ApiProperty({ description: 'Isolation enabled', example: true })
  isEnabled: boolean;
}

export class Tenant {
  @ApiProperty({ description: 'Tenant ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Tenant name' })
  name: string;

  @ApiProperty({ description: 'Subdomain' })
  subdomain: string;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

