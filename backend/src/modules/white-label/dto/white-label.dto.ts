import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsUrl, IsArray, Min, Max } from 'class-validator';

export enum WhiteLabelStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum RevenueShareModel {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_FEE = 'FIXED_FEE',
  TIERED = 'TIERED',
  HYBRID = 'HYBRID',
}

export class CreateWhiteLabelDto {
  @ApiProperty({ description: 'Partner name', example: 'ABC Financial Services' })
  @IsString()
  partnerName: string;

  @ApiProperty({ description: 'Partner code (unique)', example: 'ABC-FIN' })
  @IsString()
  partnerCode: string;

  @ApiPropertyOptional({ description: 'Custom domain', example: 'lending.abcfins.com' })
  @IsOptional()
  @IsString()
  customDomain?: string;

  @ApiPropertyOptional({ description: 'Subdomain', example: 'abc' })
  @IsOptional()
  @IsString()
  subdomain?: string;

  @ApiPropertyOptional({ description: 'Logo URL', example: 'https://cdn.abcfins.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Favicon URL', example: 'https://cdn.abcfins.com/favicon.ico' })
  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @ApiPropertyOptional({ description: 'Primary color', example: '#1E40AF' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary color', example: '#3B82F6' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Custom CSS', example: 'body { font-family: Arial; }' })
  @IsOptional()
  @IsString()
  customCss?: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'support@abcfins.com' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone', example: '+1-555-0123' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Support URL', example: 'https://support.abcfins.com' })
  @IsOptional()
  @IsUrl()
  supportUrl?: string;

  @ApiPropertyOptional({ description: 'Terms of service URL', example: 'https://abcfins.com/terms' })
  @IsOptional()
  @IsUrl()
  termsUrl?: string;

  @ApiPropertyOptional({ description: 'Privacy policy URL', example: 'https://abcfins.com/privacy' })
  @IsOptional()
  @IsUrl()
  privacyUrl?: string;

  @ApiPropertyOptional({ description: 'Revenue share model', enum: RevenueShareModel, example: RevenueShareModel.PERCENTAGE })
  @IsOptional()
  @IsEnum(RevenueShareModel)
  revenueShareModel?: RevenueShareModel;

  @ApiPropertyOptional({ description: 'Revenue share percentage', example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  revenueSharePercentage?: number;

  @ApiPropertyOptional({ description: 'Fixed fee per transaction', example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedFeePerTransaction?: number;

  @ApiPropertyOptional({ description: 'Revenue share configuration', type: Object })
  @IsOptional()
  @IsObject()
  revenueShareConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Allowed features', type: [String] })
  @IsOptional()
  @IsArray()
  allowedFeatures?: string[];

  @ApiPropertyOptional({ description: 'Custom metadata', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateWhiteLabelDto {
  @ApiPropertyOptional({ description: 'Partner name' })
  @IsOptional()
  @IsString()
  partnerName?: string;

  @ApiPropertyOptional({ description: 'Custom domain' })
  @IsOptional()
  @IsString()
  customDomain?: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Favicon URL' })
  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @ApiPropertyOptional({ description: 'Primary color' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary color' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Custom CSS' })
  @IsOptional()
  @IsString()
  customCss?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Support URL' })
  @IsOptional()
  @IsUrl()
  supportUrl?: string;

  @ApiPropertyOptional({ description: 'Terms of service URL' })
  @IsOptional()
  @IsUrl()
  termsUrl?: string;

  @ApiPropertyOptional({ description: 'Privacy policy URL' })
  @IsOptional()
  @IsUrl()
  privacyUrl?: string;

  @ApiPropertyOptional({ description: 'Revenue share model', enum: RevenueShareModel })
  @IsOptional()
  @IsEnum(RevenueShareModel)
  revenueShareModel?: RevenueShareModel;

  @ApiPropertyOptional({ description: 'Revenue share percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  revenueSharePercentage?: number;

  @ApiPropertyOptional({ description: 'Fixed fee per transaction' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedFeePerTransaction?: number;

  @ApiPropertyOptional({ description: 'Revenue share configuration', type: Object })
  @IsOptional()
  @IsObject()
  revenueShareConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Allowed features', type: [String] })
  @IsOptional()
  @IsArray()
  allowedFeatures?: string[];

  @ApiPropertyOptional({ description: 'Status', enum: WhiteLabelStatus })
  @IsOptional()
  @IsEnum(WhiteLabelStatus)
  status?: WhiteLabelStatus;

  @ApiPropertyOptional({ description: 'Custom metadata', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class WhiteLabelBranding {
  @ApiProperty({ description: 'Logo URL' })
  logoUrl: string;

  @ApiProperty({ description: 'Favicon URL' })
  faviconUrl: string;

  @ApiProperty({ description: 'Primary color' })
  primaryColor: string;

  @ApiProperty({ description: 'Secondary color' })
  secondaryColor: string;

  @ApiProperty({ description: 'Custom CSS' })
  customCss: string;

  @ApiProperty({ description: 'Company name' })
  companyName: string;
}

export class RevenueShareSummary {
  @ApiProperty({ description: 'Total revenue', example: 500000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Partner share', example: 75000 })
  partnerShare: number;

  @ApiProperty({ description: 'Platform share', example: 425000 })
  platformShare: number;

  @ApiProperty({ description: 'Number of transactions', example: 1250 })
  transactionCount: number;

  @ApiProperty({ description: 'Average transaction value', example: 400 })
  averageTransactionValue: number;

  @ApiProperty({ description: 'Revenue by period', type: [Object] })
  revenueByPeriod: Array<{
    period: string;
    totalRevenue: number;
    partnerShare: number;
    platformShare: number;
  }>;
}

