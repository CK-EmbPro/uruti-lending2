import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsDateString, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum DriftSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class EarlyWarningIndicatorsDto {
  @ApiProperty({ description: 'Payment delays trend (increasing/decreasing/stable)', example: 'increasing' })
  paymentDelaysTrend: 'increasing' | 'decreasing' | 'stable';

  @ApiProperty({ description: 'Transaction velocity trend', example: 'declining' })
  transactionVelocityTrend: 'increasing' | 'declining' | 'stable';

  @ApiProperty({ description: 'Overdraft frequency trend', example: 'increasing' })
  overdraftFrequencyTrend: 'increasing' | 'decreasing' | 'stable';

  @ApiProperty({ description: 'Hardship contact count', example: 3 })
  @IsNumber()
  hardshipContactCount: number;

  @ApiProperty({ description: 'Restructuring requests count', example: 1 })
  @IsNumber()
  restructuringRequestsCount: number;

  @ApiProperty({ description: 'Mobile money activity trend', example: 'declining' })
  mobileMoneyActivityTrend: 'increasing' | 'declining' | 'stable';

  @ApiProperty({ description: 'Days since last payment', example: 5 })
  @IsNumber()
  daysSinceLastPayment: number;

  @ApiProperty({ description: 'Number of missed payments', example: 1 })
  @IsNumber()
  missedPaymentsCount: number;
}

export class BehavioralDriftDto {
  @ApiProperty({ description: 'Repayment day shift (days later)', example: 3 })
  @IsNumber()
  repaymentDayShift: number;

  @ApiProperty({ description: 'Switched from auto-debit to manual', example: true })
  @IsBoolean()
  switchedToManual: boolean;

  @ApiProperty({ description: 'Partial payments count', example: 2 })
  @IsNumber()
  partialPaymentsCount: number;

  @ApiProperty({ description: 'App engagement decline percentage', example: 30 })
  @IsNumber()
  appEngagementDecline: number;

  @ApiProperty({ description: 'Drift severity', enum: DriftSeverity, example: DriftSeverity.MEDIUM })
  driftSeverity: DriftSeverity;

  @ApiProperty({ description: 'Baseline established', example: true })
  @IsBoolean()
  baselineEstablished: boolean;
}

export class DefaultRiskScoreDto {
  @ApiProperty({ description: 'Loan ID', example: 'loan-123' })
  loanId: string;

  @ApiProperty({ description: 'Risk score (0-100)', example: 65 })
  @IsNumber()
  riskScore: number;

  @ApiProperty({ description: 'Risk level', enum: RiskLevel, example: RiskLevel.HIGH })
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'Score change from previous day', example: 15 })
  @IsNumber()
  scoreChange: number;

  @ApiProperty({ description: 'Early warning indicators', type: EarlyWarningIndicatorsDto })
  @ValidateNested()
  @Type(() => EarlyWarningIndicatorsDto)
  indicators: EarlyWarningIndicatorsDto;

  @ApiProperty({ description: 'Behavioral drift', type: BehavioralDriftDto })
  @ValidateNested()
  @Type(() => BehavioralDriftDto)
  behavioralDrift: BehavioralDriftDto;

  @ApiProperty({ description: 'Date of score calculation', example: '2024-01-15' })
  @IsDateString()
  calculatedAt: string;

  @ApiProperty({ description: 'Alert triggered', example: true })
  @IsBoolean()
  alertTriggered: boolean;

  @ApiPropertyOptional({ description: 'Predicted default date', example: '2024-02-01' })
  @IsDateString()
  @IsOptional()
  predictedDefaultDate?: string;

  @ApiPropertyOptional({ description: 'Days until predicted default', example: 15 })
  @IsNumber()
  @IsOptional()
  daysUntilPredictedDefault?: number;
}

export class PreDefaultActionDto {
  @ApiProperty({ description: 'Action type', example: 'FRIENDLY_REMINDER' })
  actionType: string;

  @ApiProperty({ description: 'Action description', example: 'Sent friendly reminder 5 days before due date' })
  description: string;

  @ApiProperty({ description: 'Action executed', example: true })
  @IsBoolean()
  executed: boolean;

  @ApiProperty({ description: 'Execution timestamp', example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  executedAt?: string;
}

export class PredictiveDefaultCheckResultDto {
  @ApiProperty({ description: 'Loan ID', example: 'loan-123' })
  loanId: string;

  @ApiProperty({ description: 'Current risk score', type: DefaultRiskScoreDto })
  @ValidateNested()
  @Type(() => DefaultRiskScoreDto)
  currentScore: DefaultRiskScoreDto;

  @ApiProperty({ description: 'Previous risk score', type: DefaultRiskScoreDto })
  @ValidateNested()
  @Type(() => DefaultRiskScoreDto)
  previousScore?: DefaultRiskScoreDto;

  @ApiProperty({ description: 'Pre-default actions taken', type: [PreDefaultActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreDefaultActionDto)
  actionsTaken: PreDefaultActionDto[];

  @ApiProperty({ description: 'Predicted default date', example: '2024-02-01' })
  @IsDateString()
  predictedDefaultDate?: string;

  @ApiProperty({ description: 'Days until predicted default', example: 15 })
  @IsNumber()
  daysUntilPredictedDefault?: number;
}

export class CollectionsDashboardDto {
  @ApiProperty({ description: 'Total accounts at risk', example: 150 })
  @IsNumber()
  totalAtRisk: number;

  @ApiProperty({ description: 'Accounts by risk level' })
  byRiskLevel: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };

  @ApiProperty({ description: 'Prioritized accounts', type: [DefaultRiskScoreDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefaultRiskScoreDto)
  prioritizedAccounts: DefaultRiskScoreDto[];

  @ApiProperty({ description: 'Intervention success rate', example: 28.5 })
  @IsNumber()
  interventionSuccessRate: number;

  @ApiProperty({ description: 'False alarm rate', example: 8.2 })
  @IsNumber()
  falseAlarmRate: number;
}

