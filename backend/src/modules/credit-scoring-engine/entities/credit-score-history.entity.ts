import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';

export enum ScoringTrigger {
  MANUAL = 'MANUAL', // Manual API call
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED', // Application submitted
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED', // Payment received
  TRANSACTION_PROCESSED = 'TRANSACTION_PROCESSED', // Transaction processed
  EXTERNAL_DATA_UPDATE = 'EXTERNAL_DATA_UPDATE', // External data updated
  SCHEDULED_HOURLY = 'SCHEDULED_HOURLY', // Hourly scheduled update
  SCHEDULED_DAILY = 'SCHEDULED_DAILY', // Daily scheduled update
  STATUS_CHANGE = 'STATUS_CHANGE', // Loan/application status changed
}

@Entity('credit_score_history')
@Index(['applicantId'])
@Index(['applicationId'])
@Index(['loanId'])
@Index(['trigger'])
@Index(['calculatedAt'])
@Index(['applicantId', 'calculatedAt'])
export class CreditScoreHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicantId: string;

  @Column({ nullable: true })
  applicationId: string;

  @ManyToOne(() => LoanApplication, { nullable: true })
  @JoinColumn({ name: 'applicationId' })
  application: LoanApplication;

  @Column({ nullable: true })
  loanId: string;

  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({ type: 'int' })
  finalScore: number; // Final weighted credit score (300-850)

  @Column({ type: 'int', nullable: true })
  previousScore: number; // Previous score for comparison

  @Column({ type: 'int', nullable: true })
  scoreChange: number; // Change from previous score

  @Column({
    type: 'enum',
    enum: ScoringTrigger,
  })
  trigger: ScoringTrigger; // What triggered this scoring

  @Column({ type: 'jsonb', nullable: true })
  triggerMetadata: Record<string, any>; // Additional trigger context (e.g., payment amount, transaction ID)

  @Column({ type: 'jsonb' })
  scoreBreakdown: {
    traditional: any;
    alternative: any;
    behavioral: any;
  }; // Full score breakdown

  @Column({ type: 'jsonb' })
  weights: {
    TRADITIONAL_BUREAU: number;
    ALTERNATIVE_FINANCIAL: number;
    BEHAVIORAL_DIGITAL: number;
  }; // Weights used

  @Column({ type: 'varchar', length: 20, nullable: true })
  segment: string; // MICRO, SME, or ENTERPRISE

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  confidence: number; // Confidence score (0-1)

  @Column({ type: 'varchar', length: 20 })
  riskTier: string; // LOW, MEDIUM, HIGH

  @Column({ type: 'jsonb', nullable: true })
  mlScore: {
    score: number;
    confidence: number;
    featureImportance: Record<string, number>;
    riskFactors: string[];
    modelVersion: string;
  } | null; // ML score details if used

  @Column({ type: 'text', nullable: true })
  explanation: string; // Human-readable explanation

  @Column({ type: 'int', nullable: true })
  processingTimeMs: number; // Processing time in milliseconds

  @Column({ type: 'timestamp' })
  calculatedAt: Date; // When score was calculated

  @Column({ type: 'uuid', nullable: true })
  companyId: string; // Company ID for multi-tenancy

  @CreateDateColumn()
  createdAt: Date;
}

