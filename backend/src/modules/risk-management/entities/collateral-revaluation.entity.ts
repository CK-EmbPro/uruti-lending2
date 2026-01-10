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
import { LoanSecurity } from '../../loan-security/entities/loan-security.entity';

export enum RevaluationType {
  AUTOMATED = 'AUTOMATED',
  FULL_APPRAISAL = 'FULL_APPRAISAL',
  AUTOMATED_VALUATION_MODEL = 'AUTOMATED_VALUATION_MODEL',
  MARKET_DATA = 'MARKET_DATA',
  MANUAL = 'MANUAL',
}

export enum RevaluationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('collateral_revaluations')
@Index(['loanId'])
@Index(['securityId'])
@Index(['revaluationDate'])
@Index(['status'])
export class CollateralRevaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => LoanSecurity, { nullable: true })
  security: LoanSecurity;

  @Column({ nullable: true })
  securityId: string;

  @Column({
    type: 'enum',
    enum: RevaluationType,
    default: RevaluationType.AUTOMATED,
  })
  revaluationType: RevaluationType;

  @Column({ type: 'date' })
  revaluationDate: Date;

  @Column({
    type: 'enum',
    enum: RevaluationStatus,
    default: RevaluationStatus.PENDING,
  })
  status: RevaluationStatus;

  // Previous Valuation
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  previousValuation: number;

  @Column({ type: 'date', nullable: true })
  previousValuationDate: Date;

  // New Valuation
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  newValuation: number;

  @Column({ type: 'date', nullable: true })
  valuationEffectiveDate: Date;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  valuationChangePercentage: number; // Percentage change

  // Loan-to-Value (LTV) Calculations
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  loanAmount: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  outstandingBalance: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  previousLTV: number; // Previous Loan-to-Value ratio

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  newLTV: number; // New Loan-to-Value ratio

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  ltvChange: number; // Change in LTV

  // Risk Assessment
  @Column({ type: 'boolean', default: false })
  underCollateralized: boolean;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  collateralShortfall: number; // Amount of shortfall

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maxAllowedLTV: number; // Maximum allowed LTV

  // Valuation Source
  @Column({ nullable: true })
  valuationSource: string; // e.g., "Appraiser Name", "AVM Provider", "Market Data"

  @Column({ nullable: true })
  valuationReference: string; // Reference number or ID

  @Column('text', { nullable: true })
  valuationNotes: string;

  // Appraisal Details (JSON)
  @Column('jsonb', { nullable: true })
  appraisalDetails: any; // Detailed appraisal information

  // Execution
  @Column({ nullable: true })
  initiatedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  initiatedAt: Date;

  @Column({ nullable: true })
  completedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column('text', { nullable: true })
  errorMessage: string;

  // Action Required
  @Column({ type: 'boolean', default: false })
  actionRequired: boolean;

  @Column('text', { nullable: true })
  requiredAction: string;

  @Column({ type: 'boolean', default: false })
  actionTaken: boolean;

  @Column({ nullable: true })
  actionTakenBy: string;

  @Column({ type: 'timestamp', nullable: true })
  actionTakenAt: Date;

  @Column('text', { nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

