import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsArray, IsDateString, Min, Max } from 'class-validator';

export enum P2PListingStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  FUNDING = 'FUNDING',
  FUNDED = 'FUNDED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum FundingType {
  FIXED_RATE = 'FIXED_RATE',
  AUCTION = 'AUCTION',
  INSTANT = 'INSTANT',
}

export enum InvestmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FUNDED = 'FUNDED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
  CANCELLED = 'CANCELLED',
}

export class CreateP2PListingDto {
  @ApiProperty({ description: 'Loan application ID', example: 'uuid' })
  @IsString()
  loanApplicationId: string;

  @ApiProperty({ description: 'Target funding amount', example: 50000 })
  @IsNumber()
  @Min(1000)
  targetAmount: number;

  @ApiProperty({ description: 'Minimum investment', example: 100 })
  @IsNumber()
  @Min(50)
  minimumInvestment: number;

  @ApiProperty({ description: 'Maximum investment per investor', example: 10000 })
  @IsNumber()
  @Min(100)
  maximumInvestment?: number;

  @ApiProperty({ description: 'Interest rate offered', example: 8.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @ApiProperty({ description: 'Funding type', enum: FundingType })
  @IsEnum(FundingType)
  fundingType: FundingType;

  @ApiPropertyOptional({ description: 'Funding deadline (ISO format)', example: '2024-03-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  fundingDeadline?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Personal loan for home improvement' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class InvestInListingDto {
  @ApiProperty({ description: 'Listing ID', example: 'uuid' })
  @IsString()
  listingId: string;

  @ApiProperty({ description: 'Investment amount', example: 5000 })
  @IsNumber()
  @Min(50)
  investmentAmount: number;

  @ApiPropertyOptional({ description: 'Proposed interest rate (for auctions)', example: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  proposedRate?: number;
}

export class P2PListing {
  @ApiProperty({ description: 'Listing ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Loan application ID', example: 'uuid' })
  loanApplicationId: string;

  @ApiProperty({ description: 'Target amount', example: 50000 })
  targetAmount: number;

  @ApiProperty({ description: 'Current funded amount', example: 35000 })
  currentAmount: number;

  @ApiProperty({ description: 'Funding progress', example: 70 })
  fundingProgress: number;

  @ApiProperty({ description: 'Interest rate', example: 8.5 })
  interestRate: number;

  @ApiProperty({ description: 'Status', enum: P2PListingStatus })
  status: P2PListingStatus;

  @ApiProperty({ description: 'Number of investors', example: 15 })
  investorCount: number;

  @ApiProperty({ description: 'Funding deadline', example: '2024-03-01T00:00:00Z' })
  fundingDeadline: Date;
}

export class Investment {
  @ApiProperty({ description: 'Investment ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Investor ID', example: 'uuid' })
  investorId: string;

  @ApiProperty({ description: 'Listing ID', example: 'uuid' })
  listingId: string;

  @ApiProperty({ description: 'Investment amount', example: 5000 })
  investmentAmount: number;

  @ApiProperty({ description: 'Status', enum: InvestmentStatus })
  status: InvestmentStatus;

  @ApiProperty({ description: 'Investment date', example: '2024-01-15T00:00:00Z' })
  investmentDate: Date;

  @ApiProperty({ description: 'Expected returns', example: 425 })
  expectedReturns: number;
}

export class InvestorDashboard {
  @ApiProperty({ description: 'Total invested', example: 250000 })
  totalInvested: number;

  @ApiProperty({ description: 'Active investments', example: 12 })
  activeInvestments: number;

  @ApiProperty({ description: 'Total returns', example: 22500 })
  totalReturns: number;

  @ApiProperty({ description: 'Average ROI', example: 9.0 })
  averageROI: number;

  @ApiProperty({ description: 'Portfolio value', example: 272500 })
  portfolioValue: number;

  @ApiProperty({ description: 'Recent investments', type: [Object] })
  recentInvestments: Array<{
    listingId: string;
    amount: number;
    interestRate: number;
    status: string;
    investmentDate: string;
  }>;
}

