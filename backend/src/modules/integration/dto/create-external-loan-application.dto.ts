import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsObject,
  IsEnum,
  Min,
  IsEmail,
  IsPhoneNumber,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ExternalApplicationType {
  TRIP_FINANCING = 'Trip Financing',
  INVOICE_FINANCING = 'Invoice Financing',
  ORDER_FINANCING = 'Order Financing',
  OTHER = 'Other',
}

export class ExternalCustomerDto {
  @ApiProperty({ description: 'External customer ID from third-party platform' })
  @IsString()
  externalCustomerId: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'KYC status' })
  @IsString()
  @IsOptional()
  kycStatus?: string;

  @ApiPropertyOptional({ description: 'Credit score' })
  @IsNumber()
  @IsOptional()
  creditScore?: number;

  @ApiPropertyOptional({ description: 'Additional customer data' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1990-01-01' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateExternalLoanApplicationDto {
  @ApiProperty({ description: 'External reference ID (e.g., trip ID, order ID)' })
  @IsString()
  externalReferenceId: string;

  @ApiProperty({ description: 'Loan product code' })
  @IsString()
  loanProductCode: string;

  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Requested loan amount' })
  @IsNumber()
  @Min(0)
  requestedAmount: number;

  @ApiProperty({ description: 'Application type', enum: ExternalApplicationType })
  @IsEnum(ExternalApplicationType)
  applicationType: ExternalApplicationType;

  @ApiProperty({ description: 'Customer information', type: ExternalCustomerDto })
  @ValidateNested()
  @Type(() => ExternalCustomerDto)
  customer: ExternalCustomerDto;

  // Trip Financing Specific Fields
  @ApiPropertyOptional({ description: 'Trip ID from UrutiX' })
  @IsString()
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({ description: 'Cargo owner ID' })
  @IsString()
  @IsOptional()
  cargoOwnerId?: string;

  @ApiPropertyOptional({ description: 'Transporter ID' })
  @IsString()
  @IsOptional()
  transporterId?: string;

  @ApiPropertyOptional({ description: 'Expected trip revenue' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tripRevenue?: number;

  @ApiPropertyOptional({ description: 'Advance amount requested' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  advanceAmount?: number;

  @ApiPropertyOptional({ description: 'Trip start date', example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  tripStartDate?: string;

  @ApiPropertyOptional({ description: 'Trip end date', example: '2024-01-20' })
  @IsDateString()
  @IsOptional()
  tripEndDate?: string;

  @ApiPropertyOptional({ description: 'Expected revenue collection date', example: '2024-01-25' })
  @IsDateString()
  @IsOptional()
  expectedRevenueDate?: string;

  // Loan Terms
  @ApiPropertyOptional({ description: 'Repayment periods (months)' })
  @IsNumber()
  @IsOptional()
  repaymentPeriods?: number;

  @ApiPropertyOptional({ description: 'Repayment start date', example: '2024-02-01' })
  @IsDateString()
  @IsOptional()
  repaymentStartDate?: string;

  @ApiPropertyOptional({ description: 'Additional external data' })
  @IsObject()
  @IsOptional()
  externalData?: Record<string, any>;
}

