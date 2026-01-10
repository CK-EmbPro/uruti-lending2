import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsArray, IsNumber } from 'class-validator';

export enum DataSource {
  TRANSACTION_HISTORY = 'TRANSACTION_HISTORY',
  UTILITY_PAYMENTS = 'UTILITY_PAYMENTS',
  RENTAL_PAYMENTS = 'RENTAL_PAYMENTS',
  MOBILE_PHONE = 'MOBILE_PHONE',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  PSYCHOMETRIC = 'PSYCHOMETRIC',
  CASH_FLOW = 'CASH_FLOW',
  EMPLOYMENT = 'EMPLOYMENT',
  EDUCATION = 'EDUCATION',
}

export class CalculateAlternativeScoreDto {
  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Data sources to use', type: [String], enum: DataSource })
  @IsArray()
  @IsEnum(DataSource, { each: true })
  dataSources: DataSource[];

  @ApiPropertyOptional({ description: 'Transaction data', type: Object })
  @IsOptional()
  @IsObject()
  transactionData?: {
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    savingsRate: number;
    transactionCount: number;
    onTimePayments: number;
  };

  @ApiPropertyOptional({ description: 'Utility payment history', type: Object })
  @IsOptional()
  @IsObject()
  utilityPayments?: {
    electricity: { onTime: number; late: number; missed: number };
    water: { onTime: number; late: number; missed: number };
    internet: { onTime: number; late: number; missed: number };
  };

  @ApiPropertyOptional({ description: 'Rental payment history', type: Object })
  @IsOptional()
  @IsObject()
  rentalPayments?: {
    onTimePayments: number;
    latePayments: number;
    missedPayments: number;
    averageRent: number;
  };

  @ApiPropertyOptional({ description: 'Mobile phone data', type: Object })
  @IsOptional()
  @IsObject()
  mobilePhone?: {
    accountAge: number; // Months
    topUpFrequency: number;
    averageTopUpAmount: number;
    paymentMethod: string;
  };

  @ApiPropertyOptional({ description: 'Cash flow data', type: Object })
  @IsOptional()
  @IsObject()
  cashFlow?: {
    averageMonthlyIncome: number;
    incomeStability: number; // 0-100
    expenseStability: number; // 0-100
    savingsPattern: string;
  };
}

export class AlternativeCreditScore {
  @ApiProperty({ description: 'Score ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  customerId: string;

  @ApiProperty({ description: 'Alternative credit score', example: 720 })
  score: number;

  @ApiProperty({ description: 'Score range', example: { min: 300, max: 850 } })
  scoreRange: { min: number; max: number };

  @ApiProperty({ description: 'Data sources used', type: [String] })
  dataSources: string[];

  @ApiProperty({ description: 'Score breakdown', type: Object })
  scoreBreakdown: {
    transactionHistory: number;
    utilityPayments: number;
    rentalPayments: number;
    cashFlow: number;
    mobilePhone: number;
    other: number;
  };

  @ApiProperty({ description: 'Confidence level', example: 0.85 })
  confidenceLevel: number;

  @ApiProperty({ description: 'Risk factors', type: [String] })
  riskFactors: string[];

  @ApiProperty({ description: 'Positive factors', type: [String] })
  positiveFactors: string[];

  @ApiProperty({ description: 'Recommendations', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'Calculated at', example: '2024-01-15T10:30:00Z' })
  calculatedAt: string;
}

export class DataSourceVerification {
  @ApiProperty({ description: 'Data source', enum: DataSource })
  dataSource: DataSource;

  @ApiProperty({ description: 'Is verified', example: true })
  isVerified: boolean;

  @ApiProperty({ description: 'Verification method', example: 'API' })
  verificationMethod: string;

  @ApiProperty({ description: 'Data quality score', example: 0.9 })
  dataQuality: number;

  @ApiProperty({ description: 'Last verified', example: '2024-01-15T10:30:00Z' })
  lastVerified: string;
}

