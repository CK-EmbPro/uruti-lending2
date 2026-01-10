import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';

export enum SignalType {
  PAYMENT_PATTERN_CHANGE = 'PAYMENT_PATTERN_CHANGE',
  DELAYED_PAYMENT = 'DELAYED_PAYMENT',
  PAYMENT_AMOUNT_DECREASE = 'PAYMENT_AMOUNT_DECREASE',
  FREQUENT_PAYMENT_CHANGES = 'FREQUENT_PAYMENT_CHANGES',
  EXTERNAL_DATA_ALERT = 'EXTERNAL_DATA_ALERT',
  BEHAVIORAL_SCORE_DROP = 'BEHAVIORAL_SCORE_DROP',
  CREDIT_BUREAU_ALERT = 'CREDIT_BUREAU_ALERT',
  CUSTOM = 'CUSTOM',
}

export enum SignalSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum SignalStatus {
  ACTIVE = 'ACTIVE',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  ESCALATED = 'ESCALATED',
}

@Entity('early_warning_signals')
@Index(['loanId'])
@Index(['signalDate'])
@Index(['signalType'])
@Index(['severity'])
@Index(['status'])
export class EarlyWarningSignal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({
    type: 'enum',
    enum: SignalType,
  })
  signalType: SignalType;

  @Column({ type: 'date' })
  signalDate: Date;

  @Column({
    type: 'enum',
    enum: SignalSeverity,
    default: SignalSeverity.MEDIUM,
  })
  severity: SignalSeverity;

  @Column({
    type: 'enum',
    enum: SignalStatus,
    default: SignalStatus.ACTIVE,
  })
  status: SignalStatus;

  // Signal Details
  @Column()
  title: string;

  @Column('text')
  description: string;

  // Signal Data (JSON)
  @Column('jsonb', { nullable: true })
  signalData: any; // Specific data for the signal type

  @Column('jsonb', { nullable: true })
  historicalContext: any; // Historical data for comparison

  // Pattern Analysis
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  patternDeviation: number; // Percentage deviation from normal pattern

  @Column('int', { nullable: true })
  daysSinceLastPayment: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  paymentAmountChange: number; // Change in payment amount

  // Investigation
  @Column({ nullable: true })
  investigatedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  investigatedAt: Date;

  @Column('text', { nullable: true })
  investigationNotes: string;

  @Column({ type: 'boolean', default: false })
  requiresAction: boolean;

  @Column('text', { nullable: true })
  recommendedAction: string;

  // Resolution
  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column('text', { nullable: true })
  resolutionNotes: string;

  @Column('text', { nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

