import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeeType } from '../../../common/enums/fee-type.enum';

export class CreateFeeScheduleDto {
  @ApiProperty({ description: 'Fee code', example: 'LATE-FEE-001' })
  @IsString()
  feeCode: string;

  @ApiProperty({ description: 'Fee name', example: 'Late Payment Fee' })
  @IsString()
  feeName: string;

  @ApiProperty({ description: 'Fee type', enum: FeeType })
  @IsEnum(FeeType)
  feeType: FeeType;

  @ApiProperty({ description: 'Company ID', example: 'company-123' })
  @IsString()
  companyId: string;

  // Fee Amount Configuration
  @ApiPropertyOptional({ description: 'Fixed amount' })
  @IsNumber()
  @IsOptional()
  fixedAmount?: number;

  @ApiPropertyOptional({ description: 'Percentage amount (of loan amount)' })
  @IsNumber()
  @IsOptional()
  percentageAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum amount' })
  @IsNumber()
  @IsOptional()
  minimumAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount' })
  @IsNumber()
  @IsOptional()
  maximumAmount?: number;

  // Effective Date
  @ApiProperty({ description: 'Effective date', example: '2024-01-01' })
  @IsDateString()
  effectiveDate: string;

  @ApiPropertyOptional({ description: 'Expiry date', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  // Grandfathering
  @ApiPropertyOptional({ description: 'Grandfather existing accounts', default: false })
  @IsBoolean()
  @IsOptional()
  grandfatherExistingAccounts?: boolean;

  @ApiPropertyOptional({ description: 'Grandfather cutoff date', example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  grandfatherCutoffDate?: string;

  // Promotional Settings
  @ApiPropertyOptional({ description: 'Is promotional', default: false })
  @IsBoolean()
  @IsOptional()
  isPromotional?: boolean;

  @ApiPropertyOptional({ description: 'Promotional start date' })
  @IsDateString()
  @IsOptional()
  promotionalStartDate?: string;

  @ApiPropertyOptional({ description: 'Promotional end date' })
  @IsDateString()
  @IsOptional()
  promotionalEndDate?: string;

  @ApiPropertyOptional({ description: 'Promotional terms' })
  @IsString()
  @IsOptional()
  promotionalTerms?: string;

  // Application Rules
  @ApiPropertyOptional({ description: 'Applicable loan product IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableLoanProducts?: string[];

  @ApiPropertyOptional({ description: 'Applicable loan types', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableLoanTypes?: string[];

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateFeeScheduleDto {
  @ApiPropertyOptional({ description: 'Fee name' })
  @IsString()
  @IsOptional()
  feeName?: string;

  @ApiPropertyOptional({ description: 'Fixed amount' })
  @IsNumber()
  @IsOptional()
  fixedAmount?: number;

  @ApiPropertyOptional({ description: 'Percentage amount' })
  @IsNumber()
  @IsOptional()
  percentageAmount?: number;

  @ApiPropertyOptional({ description: 'Effective date' })
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ApplyFeeScheduleDto {
  @ApiPropertyOptional({ description: 'Notification message to customers' })
  @IsString()
  @IsOptional()
  notificationMessage?: string;

  @ApiPropertyOptional({ description: 'Send notification to customers', default: true })
  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;
}

