import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max } from 'class-validator';

export enum KPIType {
  REVENUE = 'REVENUE',
  PORTFOLIO = 'PORTFOLIO',
  RISK = 'RISK',
  OPERATIONAL = 'OPERATIONAL',
  CUSTOMER = 'CUSTOMER',
}

export enum TimePeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export class GetExecutiveKPIsDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Time period', enum: TimePeriod, default: 'MONTHLY' })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod;

  @ApiPropertyOptional({ description: 'KPI types to include', type: [String], enum: KPIType })
  @IsOptional()
  kpiTypes?: KPIType[];
}

export class ExecutiveKPIsResult {
  @ApiProperty({ description: 'Revenue KPIs', type: Object })
  revenue: {
    totalRevenue: number;
    revenueGrowth: number; // Percentage
    averageLoanSize: number;
    totalDisbursed: number;
    totalCollected: number;
    collectionEfficiency: number; // Percentage
    revenueTrend: Array<{ period: string; value: number }>;
  };

  @ApiProperty({ description: 'Portfolio KPIs', type: Object })
  portfolio: {
    totalPortfolioValue: number;
    activeLoans: number;
    portfolioGrowth: number; // Percentage
    averageLoanSize: number;
    portfolioAtRisk: number; // Percentage
    npaRatio: number; // Percentage
    portfolioTrend: Array<{ period: string; value: number }>;
  };

  @ApiProperty({ description: 'Risk KPIs', type: Object })
  risk: {
    overallRiskScore: number; // 0-100
    highRiskLoans: number;
    mediumRiskLoans: number;
    lowRiskLoans: number;
    averageDaysPastDue: number;
    defaultRate: number; // Percentage
    riskTrend: Array<{ period: string; value: number }>;
  };

  @ApiProperty({ description: 'Operational KPIs', type: Object })
  operational: {
    approvalRate: number; // Percentage
    averageProcessingTime: number; // Hours
    applicationVolume: number;
    rejectionRate: number; // Percentage
    operationalEfficiency: number; // 0-100
    operationalTrend: Array<{ period: string; value: number }>;
  };

  @ApiProperty({ description: 'Customer KPIs', type: Object })
  customer: {
    totalCustomers: number;
    newCustomers: number;
    customerRetentionRate: number; // Percentage
    averageCustomerValue: number;
    customerSatisfactionScore: number; // 0-100
    customerTrend: Array<{ period: string; value: number }>;
  };

  @ApiProperty({ description: 'Overall health score (0-100)', example: 85 })
  overallHealthScore: number;

  @ApiProperty({ description: 'Key insights', type: [String] })
  insights: string[];

  @ApiProperty({ description: 'Alerts and warnings', type: [String] })
  alerts: string[];
}

export class CreateCustomReportDto {
  @ApiProperty({ description: 'Report name', example: 'Monthly Portfolio Analysis' })
  @IsString()
  reportName: string;

  @ApiProperty({ description: 'Report description', example: 'Monthly analysis of loan portfolio' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Report type', example: 'PORTFOLIO' })
  @IsString()
  reportType: string;

  @ApiProperty({ description: 'Metrics to include', type: [String] })
  @IsString({ each: true })
  metrics: string[];

  @ApiProperty({ description: 'Filters', type: Object })
  filters: Record<string, any>;

  @ApiPropertyOptional({ description: 'Time period', enum: TimePeriod })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod;

  @ApiPropertyOptional({ description: 'Schedule frequency', enum: TimePeriod })
  @IsOptional()
  @IsEnum(TimePeriod)
  scheduleFrequency?: TimePeriod;
}

export class CustomReportResult {
  @ApiProperty({ description: 'Report ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Report name', example: 'Monthly Portfolio Analysis' })
  reportName: string;

  @ApiProperty({ description: 'Report data', type: Object })
  data: Record<string, any>;

  @ApiProperty({ description: 'Generated at', example: '2024-01-15T10:30:00Z' })
  generatedAt: string;

  @ApiProperty({ description: 'Export URL', example: 'https://app.example.com/reports/uuid/export' })
  exportUrl: string;
}

export class PredictiveMetricsDto {
  @ApiPropertyOptional({ description: 'Forecast period (months)', example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  forecastMonths?: number;
}

export class PredictiveMetricsResult {
  @ApiProperty({ description: 'Revenue forecast', type: Object })
  revenueForecast: {
    predictedRevenue: number;
    confidenceInterval: { lower: number; upper: number };
    growthRate: number; // Percentage
    forecastData: Array<{ month: string; predicted: number; confidence: number }>;
  };

  @ApiProperty({ description: 'Portfolio forecast', type: Object })
  portfolioForecast: {
    predictedPortfolioValue: number;
    predictedActiveLoans: number;
    growthRate: number; // Percentage
    forecastData: Array<{ month: string; predicted: number; confidence: number }>;
  };

  @ApiProperty({ description: 'Risk forecast', type: Object })
  riskForecast: {
    predictedNPA: number; // Percentage
    predictedDefaultRate: number; // Percentage
    riskTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
    forecastData: Array<{ month: string; predicted: number; confidence: number }>;
  };

  @ApiProperty({ description: 'Customer forecast', type: Object })
  customerForecast: {
    predictedNewCustomers: number;
    predictedRetentionRate: number; // Percentage
    growthRate: number; // Percentage
    forecastData: Array<{ month: string; predicted: number; confidence: number }>;
  };
}

