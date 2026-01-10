import {
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ShareableType,
  SharingParameter,
} from '../entities/loan-partner-shareable.entity';

export class CreateLoanPartnerShareableDto {
  @ApiProperty({
    description: 'Shareable type',
    enum: ShareableType,
  })
  @IsEnum(ShareableType)
  shareableType: ShareableType;

  @ApiProperty({
    description: 'Sharing parameter',
    enum: SharingParameter,
  })
  @IsEnum(SharingParameter)
  sharingParameter: SharingParameter;

  // For Collection Percentage
  @ApiPropertyOptional({
    description: 'Partner collection percentage (1-99)',
    example: 30,
    minimum: 1,
    maximum: 99,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  partnerCollectionPercentage?: number;

  @ApiPropertyOptional({
    description: 'Company collection percentage (1-99)',
    example: 70,
    minimum: 1,
    maximum: 99,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  companyCollectionPercentage?: number;

  // For Loan Amount Percentage
  @ApiPropertyOptional({
    description: 'Partner loan amount percentage (1-99)',
    example: 30,
    minimum: 1,
    maximum: 99,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  partnerLoanAmountPercentage?: number;

  @ApiPropertyOptional({
    description: 'Minimum partner loan amount percentage (1-99)',
    example: 20,
    minimum: 1,
    maximum: 99,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  minimumPartnerLoanAmountPercentage?: number;
}

