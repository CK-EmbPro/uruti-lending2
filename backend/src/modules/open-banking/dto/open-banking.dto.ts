import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsArray, IsDateString } from 'class-validator';

export enum BankConnectionStatus {
  PENDING = 'PENDING',
  CONNECTED = 'CONNECTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  ERROR = 'ERROR',
}

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  LOAN = 'LOAN',
  INVESTMENT = 'INVESTMENT',
}

export enum TransactionCategory {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
  UNCATEGORIZED = 'UNCATEGORIZED',
}

export class ConnectBankAccountDto {
  @ApiProperty({ description: 'Bank provider', example: 'plaid' })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'Public token from provider', example: 'public-token-xxx' })
  @IsString()
  publicToken: string;

  @ApiPropertyOptional({ description: 'Account ID (if specific account)', example: 'acc_xxx' })
  @IsOptional()
  @IsString()
  accountId?: string;
}

export class BankAccount {
  @ApiProperty({ description: 'Account ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  customerId: string;

  @ApiProperty({ description: 'Bank name', example: 'Chase Bank' })
  bankName: string;

  @ApiProperty({ description: 'Account type', enum: AccountType })
  accountType: AccountType;

  @ApiProperty({ description: 'Account number (masked)', example: '****1234' })
  accountNumber: string;

  @ApiProperty({ description: 'Current balance', example: 5000.00 })
  balance: number;

  @ApiProperty({ description: 'Connection status', enum: BankConnectionStatus })
  status: BankConnectionStatus;

  @ApiProperty({ description: 'Last synced date', example: '2024-01-15T00:00:00Z' })
  lastSyncedAt: Date;
}

export class BankTransaction {
  @ApiProperty({ description: 'Transaction ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Account ID', example: 'uuid' })
  accountId: string;

  @ApiProperty({ description: 'Transaction date', example: '2024-01-15T00:00:00Z' })
  transactionDate: Date;

  @ApiProperty({ description: 'Amount', example: -150.00 })
  amount: number;

  @ApiProperty({ description: 'Description', example: 'Grocery Store Purchase' })
  description: string;

  @ApiProperty({ description: 'Category', enum: TransactionCategory })
  category: TransactionCategory;

  @ApiProperty({ description: 'Merchant name', example: 'Whole Foods' })
  merchant: string;
}

export class AccountBalance {
  @ApiProperty({ description: 'Current balance', example: 5000.00 })
  current: number;

  @ApiProperty({ description: 'Available balance', example: 4500.00 })
  available: number;

  @ApiProperty({ description: 'Pending transactions', example: 500.00 })
  pending: number;

  @ApiProperty({ description: 'Last updated', example: '2024-01-15T00:00:00Z' })
  lastUpdated: Date;
}

export class IncomeVerification {
  @ApiProperty({ description: 'Monthly income', example: 5000.00 })
  monthlyIncome: number;

  @ApiProperty({ description: 'Income stability score', example: 0.85 })
  stabilityScore: number;

  @ApiProperty({ description: 'Income sources', type: [String] })
  incomeSources: string[];

  @ApiProperty({ description: 'Verification date', example: '2024-01-15T00:00:00Z' })
  verifiedDate: Date;
}
