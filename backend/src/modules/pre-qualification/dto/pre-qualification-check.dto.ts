import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreQualificationCheckDto {
  @ApiPropertyOptional({ description: 'Email address (optional for anonymous)', example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number (optional for anonymous)', example: '+1234567890' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ description: 'Requested loan amount', example: 50000, minimum: 1000 })
  @IsNumber()
  @Min(1000)
  requestedAmount: number;

  @ApiPropertyOptional({ description: 'Annual income', example: 75000, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  annualIncome?: number;

  @ApiPropertyOptional({ description: 'Employment status', example: 'Employed' })
  @IsString()
  @IsOptional()
  employmentStatus?: string;

  @ApiPropertyOptional({ description: 'Credit score (if known)', example: 750, minimum: 300, maximum: 850 })
  @IsNumber()
  @Min(300)
  @Max(850)
  @IsOptional()
  creditScore?: number;

  @ApiPropertyOptional({ description: 'Loan product ID (if specific product)', example: 'product-uuid' })
  @IsString()
  @IsOptional()
  loanProductId?: string;

  @ApiPropertyOptional({ description: 'Is anonymous pre-qual', example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}

export class PreQualificationResultDto {
  @ApiProperty({ description: 'Pre-qualification token', example: 'pq-token-123' })
  token: string;

  @ApiProperty({ description: 'Is pre-qualified', example: true })
  isQualified: boolean;

  @ApiProperty({ description: 'Estimated approved amount', example: 45000 })
  estimatedApprovedAmount: number;

  @ApiProperty({ description: 'Estimated interest rate', example: 8.5 })
  estimatedInterestRate: number;

  @ApiProperty({ description: 'Estimated loan term (months)', example: 60 })
  estimatedTerm: number;

  @ApiProperty({ description: 'Loan product recommendation', example: 'Personal Loan' })
  recommendedProduct: string;

  @ApiProperty({ description: 'Pre-qualification score', example: 85 })
  qualificationScore: number;

  @ApiProperty({ description: 'Offer expiry date', example: '2024-12-31' })
  expiryDate: string;

  @ApiProperty({ description: 'Reason for qualification status', example: 'Based on income and credit profile' })
  reason: string;

  @ApiProperty({ description: 'Next steps', example: 'Submit full application to proceed' })
  nextSteps: string;
}

