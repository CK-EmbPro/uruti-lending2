import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsDateString, Min, Max } from 'class-validator';

export enum CreditBureau {
  EXPERIAN = 'EXPERIAN',
  EQUIFAX = 'EQUIFAX',
  TRANSUNION = 'TRANSUNION',
  OTHER = 'OTHER',
}

export enum CreditScoreChangeType {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
  NO_CHANGE = 'NO_CHANGE',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateCreditMonitoringDto {
  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Credit bureau', enum: CreditBureau })
  @IsEnum(CreditBureau)
  creditBureau: CreditBureau;

  @ApiProperty({ description: 'Monitoring frequency (days)', example: 30 })
  @IsNumber()
  @Min(1)
  @Max(365)
  monitoringFrequency: number;

  @ApiPropertyOptional({ description: 'Alert threshold (score change)', example: 20 })
  @IsOptional()
  @IsNumber()
  alertThreshold?: number;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreditScoreRecord {
  @ApiProperty({ description: 'Record ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  customerId: string;

  @ApiProperty({ description: 'Credit bureau', enum: CreditBureau })
  creditBureau: CreditBureau;

  @ApiProperty({ description: 'Credit score', example: 750 })
  creditScore: number;

  @ApiProperty({ description: 'Score date', example: '2024-01-15T00:00:00Z' })
  scoreDate: Date;

  @ApiProperty({ description: 'Previous score', example: 745 })
  previousScore?: number;

  @ApiProperty({ description: 'Score change', example: 5 })
  scoreChange?: number;

  @ApiProperty({ description: 'Change type', enum: CreditScoreChangeType })
  changeType?: CreditScoreChangeType;

  @ApiProperty({ description: 'Credit factors', type: Object })
  creditFactors?: Record<string, any>;

  @ApiProperty({ description: 'Report data', type: Object })
  reportData?: Record<string, any>;
}

export class CreditAlert {
  @ApiProperty({ description: 'Alert ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  customerId: string;

  @ApiProperty({ description: 'Alert type', example: 'SIGNIFICANT_DECREASE' })
  alertType: string;

  @ApiProperty({ description: 'Severity', enum: AlertSeverity })
  severity: AlertSeverity;

  @ApiProperty({ description: 'Message', example: 'Credit score decreased by 25 points' })
  message: string;

  @ApiProperty({ description: 'Current score', example: 720 })
  currentScore: number;

  @ApiProperty({ description: 'Previous score', example: 745 })
  previousScore: number;

  @ApiProperty({ description: 'Score change', example: -25 })
  scoreChange: number;

  @ApiProperty({ description: 'Alert date', example: '2024-01-15T00:00:00Z' })
  alertDate: Date;

  @ApiProperty({ description: 'Is read', example: false })
  isRead: boolean;
}

export class CreditMonitoringSummary {
  @ApiProperty({ description: 'Total monitored customers', example: 5000 })
  totalMonitored: number;

  @ApiProperty({ description: 'Active monitoring', example: 4800 })
  activeMonitoring: number;

  @ApiProperty({ description: 'Recent score changes', example: 150 })
  recentScoreChanges: number;

  @ApiProperty({ description: 'Active alerts', example: 25 })
  activeAlerts: number;

  @ApiProperty({ description: 'Average credit score', example: 720 })
  averageCreditScore: number;

  @ApiProperty({ description: 'Score distribution', type: Object })
  scoreDistribution: {
    excellent: number; // 800+
    good: number; // 700-799
    fair: number; // 600-699
    poor: number; // <600
  };
}

