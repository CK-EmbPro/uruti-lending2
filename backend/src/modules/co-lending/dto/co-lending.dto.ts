import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsObject,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import {
  SyndicationStatus,
  SyndicationType,
} from '../entities/loan-syndication.entity';
import {
  ListingStatus,
  ListingType,
  AuctionType,
} from '../entities/loan-marketplace.entity';
import { InvestorType, InvestorStatus } from '../entities/investor-portal.entity';

export class CreateLoanSyndicationDto {
  @ApiProperty({ description: 'Loan ID' })
  @IsUUID()
  loanId: string;

  @ApiProperty({ description: 'Syndication type', enum: SyndicationType })
  @IsEnum(SyndicationType)
  syndicationType: SyndicationType;

  @ApiProperty({ description: 'Total amount to be syndicated' })
  @IsNumber()
  @Min(0.01)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Lead lender ID' })
  @IsUUID()
  @IsOptional()
  leadLenderId?: string;

  @ApiPropertyOptional({ description: 'Lead lender share percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  leadLenderSharePercentage?: number;

  @ApiPropertyOptional({ description: 'Syndication deadline (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  syndicationDeadline?: string;

  @ApiPropertyOptional({ description: 'Funding date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  fundingDate?: string;

  @ApiPropertyOptional({ description: 'Syndication terms' })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({ description: 'Risk sharing agreement' })
  @IsObject()
  @IsOptional()
  riskSharing?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Revenue sharing agreement' })
  @IsObject()
  @IsOptional()
  revenueSharing?: Record<string, any>;
}

export class JoinSyndicationDto {
  @ApiProperty({ description: 'Amount to commit' })
  @IsNumber()
  @Min(0.01)
  committedAmount: number;

  @ApiPropertyOptional({ description: 'Interest rate' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  interestRate?: number;

  @ApiPropertyOptional({ description: 'Lender-specific terms' })
  @IsObject()
  @IsOptional()
  terms?: Record<string, any>;
}

export class CreateMarketplaceListingDto {
  @ApiPropertyOptional({ description: 'Loan application ID (for primary listings)' })
  @IsUUID()
  @IsOptional()
  loanApplicationId?: string;

  @ApiPropertyOptional({ description: 'Loan ID (for secondary listings)' })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiProperty({ description: 'Loan product ID' })
  @IsUUID()
  loanProductId: string;

  @ApiProperty({ description: 'Listing type', enum: ListingType })
  @IsEnum(ListingType)
  listingType: ListingType;

  @ApiProperty({ description: 'Listing title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Listing description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Loan amount' })
  @IsNumber()
  @Min(0.01)
  loanAmount: number;

  @ApiProperty({ description: 'Interest rate' })
  @IsNumber()
  @Min(0)
  interestRate: number;

  @ApiProperty({ description: 'Tenure in months' })
  @IsInt()
  @Min(1)
  tenureMonths: number;

  @ApiPropertyOptional({ description: 'Auction type', enum: AuctionType })
  @IsEnum(AuctionType)
  @IsOptional()
  auctionType?: AuctionType;

  @ApiPropertyOptional({ description: 'Minimum interest rate (for auctions)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minInterestRate?: number;

  @ApiPropertyOptional({ description: 'Maximum interest rate (for auctions)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxInterestRate?: number;

  @ApiPropertyOptional({ description: 'Reserve price (for auctions)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reservePrice?: number;

  @ApiPropertyOptional({ description: 'Listing expiry date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  listingExpiryDate?: string;

  @ApiPropertyOptional({ description: 'Funding deadline (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  fundingDeadline?: string;

  @ApiPropertyOptional({ description: 'Borrower profile (anonymized)' })
  @IsObject()
  @IsOptional()
  borrowerProfile?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Risk metrics' })
  @IsObject()
  @IsOptional()
  riskMetrics?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Listing terms' })
  @IsObject()
  @IsOptional()
  terms?: Record<string, any>;
}

export class PlaceBidDto {
  @ApiProperty({ description: 'Bid amount' })
  @IsNumber()
  @Min(0.01)
  bidAmount: number;

  @ApiPropertyOptional({ description: 'Proposed interest rate (for auctions)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  proposedInterestRate?: number;

  @ApiPropertyOptional({ description: 'Bid notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateInvestorDto {
  @ApiProperty({ description: 'Investor code' })
  @IsString()
  investorCode: string;

  @ApiProperty({ description: 'Investor name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Investor type', enum: InvestorType })
  @IsEnum(InvestorType)
  investorType: InvestorType;

  @ApiPropertyOptional({ description: 'KYC data' })
  @IsObject()
  @IsOptional()
  kycData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Risk profile' })
  @IsObject()
  @IsOptional()
  riskProfile?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Investment preferences' })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;
}

export class GetListingsDto {
  @ApiPropertyOptional({ description: 'Listing type', enum: ListingType })
  @IsEnum(ListingType)
  @IsOptional()
  listingType?: ListingType;

  @ApiPropertyOptional({ description: 'Status', enum: ListingStatus })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Minimum loan amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum loan amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum interest rate' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minInterestRate?: number;

  @ApiPropertyOptional({ description: 'Maximum interest rate' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxInterestRate?: number;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Results per page', minimum: 1, maximum: 100, default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

