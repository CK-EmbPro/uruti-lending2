import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsArray, IsDateString, Min, Max } from 'class-validator';

export enum PaymentMethodType {
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
}

export enum PaymentMethodStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  VERIFIED = 'VERIFIED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum AutoPayFrequency {
  MONTHLY = 'MONTHLY',
  BIWEEKLY = 'BIWEEKLY',
  WEEKLY = 'WEEKLY',
}

export enum CommunicationPreference {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  NONE = 'NONE',
}

export class AddPaymentMethodDto {
  @ApiProperty({ description: 'Payment method type', enum: PaymentMethodType })
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @ApiProperty({ description: 'Account/card number (last 4 digits)', example: '1234' })
  @IsString()
  last4: string;

  @ApiProperty({ description: 'Bank/card name', example: 'Chase Bank' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Is default', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ description: 'Tokenized payment method ID (from payment processor)', example: 'tok_xxx' })
  @IsString()
  tokenId: string;
}

export class SetupAutoPayDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Payment method ID', example: 'uuid' })
  @IsString()
  paymentMethodId: string;

  @ApiProperty({ description: 'Auto-pay frequency', enum: AutoPayFrequency })
  @IsEnum(AutoPayFrequency)
  frequency: AutoPayFrequency;

  @ApiPropertyOptional({ description: 'Payment amount (null for minimum payment)', example: 500.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-02-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class SubmitLoanApplicationDto {
  @ApiProperty({ description: 'Loan product ID', example: 'uuid' })
  @IsString()
  loanProductId: string;

  @ApiProperty({ description: 'Requested loan amount', example: 50000 })
  @IsNumber()
  @Min(1000)
  requestedAmount: number;

  @ApiPropertyOptional({ description: 'Purpose of loan', example: 'Home improvement' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Additional information', type: Object })
  @IsOptional()
  @IsObject()
  additionalInfo?: Record<string, any>;
}

export class UploadDocumentDto {
  @ApiProperty({ description: 'Document type', example: 'INCOME_STATEMENT' })
  @IsString()
  documentType: string;

  @ApiProperty({ description: 'Document name', example: 'W2_2023.pdf' })
  @IsString()
  documentName: string;

  @ApiProperty({ description: 'File URL or base64', example: 'https://...' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Description', example: '2023 W2 Form' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCommunicationPreferencesDto {
  @ApiPropertyOptional({ description: 'Payment reminders', enum: CommunicationPreference })
  @IsOptional()
  @IsEnum(CommunicationPreference)
  paymentReminders?: CommunicationPreference;

  @ApiPropertyOptional({ description: 'Statement notifications', enum: CommunicationPreference })
  @IsOptional()
  @IsEnum(CommunicationPreference)
  statementNotifications?: CommunicationPreference;

  @ApiPropertyOptional({ description: 'Account updates', enum: CommunicationPreference })
  @IsOptional()
  @IsEnum(CommunicationPreference)
  accountUpdates?: CommunicationPreference;

  @ApiPropertyOptional({ description: 'Marketing communications', enum: CommunicationPreference })
  @IsOptional()
  @IsEnum(CommunicationPreference)
  marketing?: CommunicationPreference;
}

export class FinancialGoalDto {
  @ApiProperty({ description: 'Goal name', example: 'Pay off loan early' })
  @IsString()
  goalName: string;

  @ApiProperty({ description: 'Target amount', example: 50000 })
  @IsNumber()
  @Min(0)
  targetAmount: number;

  @ApiProperty({ description: 'Target date (ISO format)', example: '2025-12-31T00:00:00Z' })
  @IsDateString()
  targetDate: string;

  @ApiPropertyOptional({ description: 'Current progress', example: 25000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentProgress?: number;
}

export class PaymentMethod {
  @ApiProperty({ description: 'Payment method ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Type', enum: PaymentMethodType })
  type: PaymentMethodType;

  @ApiProperty({ description: 'Last 4 digits', example: '1234' })
  last4: string;

  @ApiProperty({ description: 'Name', example: 'Chase Bank' })
  name: string;

  @ApiProperty({ description: 'Status', enum: PaymentMethodStatus })
  status: PaymentMethodStatus;

  @ApiProperty({ description: 'Is default', example: true })
  isDefault: boolean;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

export class AutoPayConfiguration {
  @ApiProperty({ description: 'Auto-pay ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  loanId: string;

  @ApiProperty({ description: 'Payment method ID', example: 'uuid' })
  paymentMethodId: string;

  @ApiProperty({ description: 'Frequency', enum: AutoPayFrequency })
  frequency: AutoPayFrequency;

  @ApiProperty({ description: 'Amount', example: 500.00 })
  amount: number;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Next payment date', example: '2024-02-01T00:00:00Z' })
  nextPaymentDate: Date;
}

