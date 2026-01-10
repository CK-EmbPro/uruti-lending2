import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../../../common/enums/product-status.enum';

export class CreateProductConfigurationDto {
  @ApiProperty({ description: 'Product code', example: 'PL-001' })
  @IsString()
  productCode: string;

  @ApiProperty({ description: 'Product name', example: 'Personal Loan Premium' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Company ID', example: 'company-123' })
  @IsString()
  companyId: string;

  // Eligibility Criteria
  @ApiPropertyOptional({ description: 'Minimum loan amount' })
  @IsNumber()
  @IsOptional()
  minimumLoanAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum loan amount' })
  @IsNumber()
  @IsOptional()
  maximumLoanAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum credit score' })
  @IsNumber()
  @IsOptional()
  minimumCreditScore?: number;

  @ApiPropertyOptional({ description: 'Minimum age' })
  @IsNumber()
  @IsOptional()
  minimumAge?: number;

  @ApiPropertyOptional({ description: 'Maximum age' })
  @IsNumber()
  @IsOptional()
  maximumAge?: number;

  @ApiPropertyOptional({ description: 'Maximum debt-to-income ratio' })
  @IsNumber()
  @IsOptional()
  maximumDebtToIncomeRatio?: number;

  @ApiPropertyOptional({ description: 'Required documents', type: [String] })
  @IsOptional()
  requiredDocuments?: string[];

  @ApiPropertyOptional({ description: 'Employment types', type: [String] })
  @IsOptional()
  employmentTypes?: string[];

  // Pricing Configuration
  @ApiProperty({ description: 'Base interest rate' })
  @IsNumber()
  baseInterestRate: number;

  @ApiPropertyOptional({ description: 'Minimum interest rate' })
  @IsNumber()
  @IsOptional()
  minimumInterestRate?: number;

  @ApiPropertyOptional({ description: 'Maximum interest rate' })
  @IsNumber()
  @IsOptional()
  maximumInterestRate?: number;

  @ApiPropertyOptional({ description: 'Interest rate factors', type: Object })
  @IsObject()
  @IsOptional()
  interestRateFactors?: Record<string, any>;

  // Workflow Configuration
  @ApiPropertyOptional({ description: 'Approval workflow', type: Object })
  @IsObject()
  @IsOptional()
  approvalWorkflow?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Disbursement workflow', type: Object })
  @IsObject()
  @IsOptional()
  disbursementWorkflow?: Record<string, any>;

  // Product Settings
  @ApiPropertyOptional({ description: 'Minimum term in months' })
  @IsNumber()
  @IsOptional()
  minimumTerm?: number;

  @ApiPropertyOptional({ description: 'Maximum term in months' })
  @IsNumber()
  @IsOptional()
  maximumTerm?: number;

  @ApiPropertyOptional({ description: 'Allows prepayment', default: true })
  @IsBoolean()
  @IsOptional()
  allowsPrepayment?: boolean;

  @ApiPropertyOptional({ description: 'Allows refinancing', default: false })
  @IsBoolean()
  @IsOptional()
  allowsRefinancing?: boolean;

  @ApiPropertyOptional({ description: 'Requires collateral', default: false })
  @IsBoolean()
  @IsOptional()
  requiresCollateral?: boolean;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  productDescription?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsString()
  @IsOptional()
  termsAndConditions?: string;
}

export class UpdateProductConfigurationDto {
  @ApiPropertyOptional({ description: 'Product name' })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional({ description: 'Product status', enum: ProductStatus })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  // All other fields from CreateProductConfigurationDto are optional
  @ApiPropertyOptional()
  @IsOptional()
  minimumLoanAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  maximumLoanAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  baseInterestRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  remarks?: string;
}

export class TestProductConfigurationDto {
  @ApiPropertyOptional({ description: 'Test scenarios', type: Object })
  @IsObject()
  @IsOptional()
  testScenarios?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Test remarks' })
  @IsString()
  @IsOptional()
  testRemarks?: string;
}

export class ActivateProductConfigurationDto {
  @ApiPropertyOptional({ description: 'Activation remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

