import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsArray, IsDateString, Min, Max } from 'class-validator';

export enum ListingCategory {
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  BUSINESS_LOAN = 'BUSINESS_LOAN',
  AUTO_LOAN = 'AUTO_LOAN',
  MORTGAGE = 'MORTGAGE',
  STUDENT_LOAN = 'STUDENT_LOAN',
  OTHER = 'OTHER',
}

export enum ListingPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum FilterType {
  RISK_LEVEL = 'RISK_LEVEL',
  INTEREST_RATE = 'INTEREST_RATE',
  LOAN_AMOUNT = 'LOAN_AMOUNT',
  TERM = 'TERM',
  CATEGORY = 'CATEGORY',
}

export class CreateMarketplaceListingDto {
  @ApiProperty({ description: 'Loan application ID', example: 'uuid' })
  @IsString()
  loanApplicationId: string;

  @ApiProperty({ description: 'Listing title', example: 'Personal Loan - $50,000' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Listing description', example: 'Personal loan for home improvement' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Category', enum: ListingCategory })
  @IsEnum(ListingCategory)
  category: ListingCategory;

  @ApiProperty({ description: 'Target amount', example: 50000 })
  @IsNumber()
  @Min(1000)
  targetAmount: number;

  @ApiProperty({ description: 'Interest rate', example: 8.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @ApiPropertyOptional({ description: 'Priority', enum: ListingPriority })
  @IsOptional()
  @IsEnum(ListingPriority)
  priority?: ListingPriority;

  @ApiPropertyOptional({ description: 'Featured listing', example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class MarketplaceFilterDto {
  @ApiPropertyOptional({ description: 'Category', enum: ListingCategory })
  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;

  @ApiPropertyOptional({ description: 'Min interest rate', example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minInterestRate?: number;

  @ApiPropertyOptional({ description: 'Max interest rate', example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxInterestRate?: number;

  @ApiPropertyOptional({ description: 'Min loan amount', example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Max loan amount', example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Risk level', example: 'LOW' })
  @IsOptional()
  @IsString()
  riskLevel?: string;
}

export class MarketplaceListing {
  @ApiProperty({ description: 'Listing ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Title' })
  title: string;

  @ApiProperty({ description: 'Category', enum: ListingCategory })
  category: ListingCategory;

  @ApiProperty({ description: 'Target amount', example: 50000 })
  targetAmount: number;

  @ApiProperty({ description: 'Current amount', example: 35000 })
  currentAmount: number;

  @ApiProperty({ description: 'Funding progress', example: 70 })
  fundingProgress: number;

  @ApiProperty({ description: 'Interest rate', example: 8.5 })
  interestRate: number;

  @ApiProperty({ description: 'Investor count', example: 15 })
  investorCount: number;

  @ApiProperty({ description: 'Is featured', example: false })
  isFeatured: boolean;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

export class MarketplaceStats {
  @ApiProperty({ description: 'Total listings', example: 500 })
  totalListings: number;

  @ApiProperty({ description: 'Active listings', example: 350 })
  activeListings: number;

  @ApiProperty({ description: 'Total funded', example: 5000000 })
  totalFunded: number;

  @ApiProperty({ description: 'Average interest rate', example: 9.5 })
  averageInterestRate: number;

  @ApiProperty({ description: 'Total investors', example: 1250 })
  totalInvestors: number;

  @ApiProperty({ description: 'Success rate', example: 85.5 })
  successRate: number;
}

