import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefinancingType } from '../entities/refinancing-application.entity';

export class CreateRefinancingApplicationDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Refinancing type', enum: RefinancingType })
  @IsEnum(RefinancingType)
  refinancingType: RefinancingType;

  @ApiPropertyOptional({ description: 'Requested amount', example: 50000.00 })
  @IsNumber()
  @IsOptional()
  requestedAmount?: number;

  @ApiPropertyOptional({ description: 'Requested interest rate', example: 5.5 })
  @IsNumber()
  @IsOptional()
  requestedRate?: number;

  @ApiPropertyOptional({ description: 'Requested term in months', example: 60 })
  @IsNumber()
  @IsOptional()
  requestedTerm?: number;
}

export class CheckEligibilityDto {
  @ApiPropertyOptional({ description: 'Eligibility notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class OfferRefinancingDto {
  @ApiProperty({ description: 'Offered interest rate', example: 5.5 })
  @IsNumber()
  offeredRate: number;

  @ApiProperty({ description: 'Offered amount', example: 50000.00 })
  @IsNumber()
  offeredAmount: number;

  @ApiProperty({ description: 'Offered term in months', example: 60 })
  @IsNumber()
  offeredTerm: number;

  @ApiProperty({ description: 'Offer expiry date', example: '2024-04-30' })
  @IsDateString()
  offerExpiryDate: string;
}














