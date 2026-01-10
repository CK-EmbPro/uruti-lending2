import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsDateString, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TransactionType {
  DISBURSEMENT = 'DISBURSEMENT',
  REPAYMENT_PRINCIPAL = 'REPAYMENT_PRINCIPAL',
  REPAYMENT_INTEREST = 'REPAYMENT_INTEREST',
  REPAYMENT_FEES = 'REPAYMENT_FEES',
  REFUND = 'REFUND',
  WRITE_OFF = 'WRITE_OFF',
  INVESTOR_TRANSFER = 'INVESTOR_TRANSFER',
  FEE = 'FEE',
  INTEREST_ACCRUAL = 'INTEREST_ACCRUAL',
}

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum LedgerEntryStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

export enum MismatchType {
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  DUPLICATE_REFERENCE = 'DUPLICATE_REFERENCE',
  WRONG_ACCOUNT = 'WRONG_ACCOUNT',
  UNALLOCATED = 'UNALLOCATED',
}

export class LedgerEntryDto {
  @ApiProperty({ description: 'Entry ID', example: 'entry-123' })
  id: string;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType, example: TransactionType.DISBURSEMENT })
  transactionType: TransactionType;

  @ApiProperty({ description: 'Debit account code', example: 'LOAN_ASSETS' })
  debitAccount: string;

  @ApiProperty({ description: 'Credit account code', example: 'CASH' })
  creditAccount: string;

  @ApiProperty({ description: 'Amount', example: 50000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Exchange rate (if multi-currency)', example: 1.0 })
  @IsNumber()
  @IsOptional()
  exchangeRate?: number;

  @ApiProperty({ description: 'Reference number', example: 'REF-123456' })
  @IsString()
  referenceNumber: string;

  @ApiProperty({ description: 'Loan ID (if applicable)', example: 'loan-123' })
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiProperty({ description: 'Customer ID (if applicable)', example: 'customer-123' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Description', example: 'Loan disbursement' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Status', enum: LedgerEntryStatus, example: LedgerEntryStatus.POSTED })
  status: LedgerEntryStatus;

  @ApiProperty({ description: 'Created by user ID', example: 'user-123' })
  @IsString()
  createdBy: string;

  @ApiProperty({ description: 'Source system', example: 'LOAN_SYSTEM' })
  @IsString()
  source: string;

  @ApiProperty({ description: 'Created timestamp', example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Posted timestamp', example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  @IsOptional()
  postedAt?: string;
}

export class PaymentMismatchDto {
  @ApiProperty({ description: 'Mismatch ID', example: 'mismatch-123' })
  id: string;

  @ApiProperty({ description: 'Mismatch type', enum: MismatchType, example: MismatchType.AMOUNT_MISMATCH })
  mismatchType: MismatchType;

  @ApiProperty({ description: 'Payment reference number', example: 'PAY-123456' })
  @IsString()
  referenceNumber: string;

  @ApiProperty({ description: 'Payment amount', example: 5000 })
  @IsNumber()
  paymentAmount: number;

  @ApiProperty({ description: 'Expected amount', example: 4500 })
  @IsNumber()
  @IsOptional()
  expectedAmount?: number;

  @ApiProperty({ description: 'Customer ID from payment', example: 'customer-123' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Loan ID from payment', example: 'loan-123' })
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiProperty({ description: 'Suggested resolution', example: 'Match to loan-123 based on amount and timing' })
  @IsString()
  @IsOptional()
  suggestedResolution?: string;

  @ApiProperty({ description: 'Auto-allocated', example: false })
  @IsBoolean()
  autoAllocated: boolean;

  @ApiProperty({ description: 'Created timestamp', example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Resolved timestamp', example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  @IsOptional()
  resolvedAt?: string;
}

export class ReconciliationReportDto {
  @ApiProperty({ description: 'Reconciliation date', example: '2024-01-15' })
  @IsDateString()
  reconciliationDate: string;

  @ApiProperty({ description: 'Total ledger entries', example: 150 })
  @IsNumber()
  totalLedgerEntries: number;

  @ApiProperty({ description: 'Total bank transactions', example: 148 })
  @IsNumber()
  totalBankTransactions: number;

  @ApiProperty({ description: 'Matched entries', example: 145 })
  @IsNumber()
  matchedEntries: number;

  @ApiProperty({ description: 'Unmatched ledger entries', example: 5 })
  @IsNumber()
  unmatchedLedgerEntries: number;

  @ApiProperty({ description: 'Unmatched bank transactions', example: 3 })
  @IsNumber()
  unmatchedBankTransactions: number;

  @ApiProperty({ description: 'Reconciliation status', example: 'COMPLETED' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Discrepancies', type: [String] })
  @IsArray()
  discrepancies: string[];
}

export class CreateLedgerEntryRequestDto {
  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  transactionType: TransactionType;

  @ApiProperty({ description: 'Debit account code', example: 'LOAN_ASSETS' })
  @IsString()
  debitAccount: string;

  @ApiProperty({ description: 'Credit account code', example: 'CASH' })
  @IsString()
  creditAccount: string;

  @ApiProperty({ description: 'Amount', example: 50000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'Exchange rate (if multi-currency)', example: 1.0 })
  @IsNumber()
  @IsOptional()
  exchangeRate?: number;

  @ApiProperty({ description: 'Reference number', example: 'REF-123456' })
  @IsString()
  referenceNumber: string;

  @ApiProperty({ description: 'Loan ID (if applicable)', example: 'loan-123' })
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiProperty({ description: 'Customer ID (if applicable)', example: 'customer-123' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Description', example: 'Loan disbursement' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Source system', example: 'LOAN_SYSTEM' })
  @IsString()
  source: string;
}

export class ProcessPaymentRequestDto {
  @ApiProperty({ description: 'Payment reference number', example: 'PAY-123456' })
  @IsString()
  referenceNumber: string;

  @ApiProperty({ description: 'Payment amount', example: 5000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Customer ID (if provided)', example: 'customer-123' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Loan ID (if provided)', example: 'loan-123' })
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiProperty({ description: 'Payment date', example: '2024-01-15' })
  @IsDateString()
  paymentDate: string;
}

