import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CreditDecision } from './credit-decision.entity';
import { Loan } from '../../loan/entities/loan.entity';

export enum OverrideOutcome {
  SUCCESS = 'SUCCESS', // Loan repaid successfully
  DEFAULT = 'DEFAULT', // Loan defaulted
  ACTIVE = 'ACTIVE', // Loan still active
  WRITTEN_OFF = 'WRITTEN_OFF', // Loan written off
  CANCELLED = 'CANCELLED', // Loan cancelled before disbursement
}

@Entity('override_audits')
@Index(['overrideDecisionId'])
@Index(['loanId'])
@Index(['outcome'])
@Index(['createdAt'])
@Index(['companyId'])
export class OverrideAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  overrideDecisionId: string;

  @ManyToOne(() => CreditDecision)
  @JoinColumn({ name: 'overrideDecisionId' })
  overrideDecision: CreditDecision;

  @Column({ nullable: true })
  loanId: string; // Link to loan if created

  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column()
  applicationId: string;

  // Original Decision
  @Column({ type: 'jsonb' })
  originalDecision: {
    outcome: string;
    creditScore: number;
    approvedAmount: number | null;
    decisionRationale: string;
  };

  // Override Decision
  @Column({ type: 'jsonb' })
  overrideDecisionData: {
    outcome: string;
    approvedAmount: number;
    approvedInterestRate: number | null;
    approvedTerm: number | null;
    overrideJustification: string;
    decisionBy: string;
    decisionDate: Date;
  };

  // Outcome Tracking
  @Column({
    type: 'enum',
    enum: OverrideOutcome,
    nullable: true,
  })
  outcome: OverrideOutcome | null; // Final outcome of the override

  @Column({ type: 'timestamp', nullable: true })
  outcomeDate: Date; // Date when outcome was determined

  // Performance Metrics
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalRepaid: number; // Total amount repaid

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalDefaulted: number; // Total amount defaulted

  @Column({ type: 'int', nullable: true })
  daysToDefault: number | null; // Days from disbursement to default

  @Column({ type: 'int', nullable: true })
  daysToRepayment: number | null; // Days from disbursement to full repayment

  @Column({ type: 'boolean', default: false })
  wasSuccessful: boolean; // Whether override was successful (loan repaid)

  @Column({ type: 'boolean', default: false })
  wasDefaulted: boolean; // Whether loan defaulted

  // Comparison with Model
  @Column({ type: 'jsonb', nullable: true })
  modelPrediction: {
    predictedOutcome: string;
    predictedDefaultProbability: number;
    predictedRiskTier: string;
  };

  @Column({ type: 'boolean', nullable: true })
  modelWasCorrect: boolean | null; // Whether model prediction was correct

  @Column({ type: 'boolean', nullable: true })
  overrideWasCorrect: boolean | null; // Whether override decision was correct

  // Additional Tracking
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

