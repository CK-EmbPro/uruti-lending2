import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsArray } from 'class-validator';

export enum CreditBureauProvider {
  EXPERIAN = 'EXPERIAN',
  EQUIFAX = 'EQUIFAX',
  TRANSUNION = 'TRANSUNION',
  MULTI_BUREAU = 'MULTI_BUREAU', // Pull from all three
}

export enum CreditReportStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export class PullCreditReportDto {
  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Application ID', example: 'uuid' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Credit bureau provider', enum: CreditBureauProvider, default: CreditBureauProvider.MULTI_BUREAU })
  @IsEnum(CreditBureauProvider)
  provider: CreditBureauProvider;

  @ApiPropertyOptional({ description: 'SSN/National ID', example: '123-45-6789' })
  @IsOptional()
  @IsString()
  ssn?: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1990-01-15' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Request reason', example: 'LOAN_APPLICATION' })
  @IsOptional()
  @IsString()
  requestReason?: string;
}

export class CreditReport {
  @ApiProperty({ description: 'Report ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  customerId: string;

  @ApiProperty({ description: 'Application ID', example: 'uuid' })
  applicationId: string;

  @ApiProperty({ description: 'Provider', enum: CreditBureauProvider })
  provider: CreditBureauProvider;

  @ApiProperty({ description: 'Status', enum: CreditReportStatus })
  status: CreditReportStatus;

  @ApiProperty({ description: 'Credit score', example: 750 })
  creditScore: number;

  @ApiProperty({ description: 'Credit score range', example: { min: 300, max: 850 } })
  scoreRange: { min: number; max: number };

  @ApiProperty({ description: 'Credit factors', type: Object })
  creditFactors: {
    paymentHistory: number;
    creditUtilization: number;
    creditAge: number;
    creditMix: number;
    newCredit: number;
  };

  @ApiProperty({ description: 'Accounts summary', type: Object })
  accountsSummary: {
    totalAccounts: number;
    openAccounts: number;
    closedAccounts: number;
    totalDebt: number;
    availableCredit: number;
    creditUtilization: number;
  };

  @ApiProperty({ description: 'Payment history', type: Object })
  paymentHistory: {
    onTimePayments: number;
    latePayments30: number;
    latePayments60: number;
    latePayments90: number;
    collections: number;
    bankruptcies: number;
  };

  @ApiProperty({ description: 'Inquiries', type: [Object] })
  inquiries: Array<{
    date: string;
    creditor: string;
    type: string;
  }>;

  @ApiProperty({ description: 'Public records', type: [Object] })
  publicRecords: Array<{
    type: string;
    date: string;
    amount: number;
    status: string;
  }>;

  @ApiProperty({ description: 'Raw report data', type: Object })
  rawReportData: Record<string, any>;

  @ApiProperty({ description: 'Pulled at', example: '2024-01-15T10:30:00Z' })
  pulledAt: string;

  @ApiProperty({ description: 'Expires at', example: '2024-02-15T10:30:00Z' })
  expiresAt: string;
}

export class CreditMonitoringAlert {
  @ApiProperty({ description: 'Alert ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  customerId: string;

  @ApiProperty({ description: 'Alert type', example: 'SCORE_CHANGE' })
  alertType: string;

  @ApiProperty({ description: 'Alert message', example: 'Credit score decreased by 20 points' })
  message: string;

  @ApiProperty({ description: 'Severity', example: 'MEDIUM', enum: ['LOW', 'MEDIUM', 'HIGH'] })
  severity: string;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;
}

export class EnableCreditMonitoringDto {
  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Enable monitoring', default: true })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Alert preferences', type: Object })
  @IsOptional()
  @IsObject()
  alertPreferences?: {
    scoreChangeThreshold?: number;
    newInquiry?: boolean;
    newAccount?: boolean;
    paymentMissed?: boolean;
    publicRecord?: boolean;
  };
}

