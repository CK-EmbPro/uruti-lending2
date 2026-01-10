import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum PortfolioPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export class PortfolioAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Period grouping', enum: PortfolioPeriod, default: 'monthly' })
  @IsOptional()
  @IsEnum(PortfolioPeriod)
  period?: PortfolioPeriod;

  @ApiPropertyOptional({ description: 'Loan product ID filter', example: 'uuid' })
  @IsOptional()
  @IsString()
  loanProductId?: string;

  @ApiPropertyOptional({ description: 'Status filter', example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class PortfolioAnalyticsResult {
  @ApiProperty({ description: 'Total portfolio value', example: 10000000 })
  totalPortfolioValue: number;

  @ApiProperty({ description: 'Total outstanding', example: 7500000 })
  totalOutstanding: number;

  @ApiProperty({ description: 'Total disbursed', example: 10000000 })
  totalDisbursed: number;

  @ApiProperty({ description: 'Total collected', example: 2500000 })
  totalCollected: number;

  @ApiProperty({ description: 'Number of active loans', example: 150 })
  activeLoansCount: number;

  @ApiProperty({ description: 'Average loan size', example: 66666.67 })
  averageLoanSize: number;

  @ApiProperty({ description: 'Portfolio at Risk (PAR)', example: 0.05 })
  portfolioAtRisk: number; // Percentage

  @ApiProperty({ description: 'Non-Performing Assets (NPA)', example: 0.02 })
  npaRatio: number; // Percentage

  @ApiProperty({ description: 'Collection efficiency', example: 0.95 })
  collectionEfficiency: number; // Percentage

  @ApiProperty({ description: 'Time-series data', type: Object })
  timeSeries: Array<{
    period: string;
    disbursed: number;
    collected: number;
    outstanding: number;
    newLoans: number;
    closedLoans: number;
  }>;

  @ApiProperty({ description: 'Product breakdown', type: Object })
  productBreakdown: Array<{
    productId: string;
    productName: string;
    loanCount: number;
    totalDisbursed: number;
    totalOutstanding: number;
    averageSize: number;
  }>;

  @ApiProperty({ description: 'Status breakdown', type: Object })
  statusBreakdown: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;

  @ApiProperty({ description: 'Risk metrics', type: Object })
  riskMetrics: {
    highRiskLoans: number;
    mediumRiskLoans: number;
    lowRiskLoans: number;
    averageDaysPastDue: number;
  };
}

