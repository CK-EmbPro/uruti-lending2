import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

export enum DecisionType {
  AUTOMATED = 'Automated',
  MANUAL = 'Manual',
  OVERRIDE = 'Override',
}

export enum DecisionOutcome {
  APPROVED = 'Approved',
  CONDITIONALLY_APPROVED = 'Conditionally Approved',
  DECLINED = 'Declined',
  REFERRED = 'Referred',
}

@Entity('credit_decisions')
@Index(['applicationId'])
@Index(['decisionDate'])
@Index(['decisionType', 'outcome'])
export class CreditDecision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationId: string;

  @ManyToOne(() => LoanApplication)
  @JoinColumn({ name: 'applicationId' })
  application: LoanApplication;

  @Column({
    type: 'enum',
    enum: DecisionType,
    default: DecisionType.AUTOMATED,
  })
  decisionType: DecisionType;

  @Column({
    type: 'enum',
    enum: DecisionOutcome,
  })
  outcome: DecisionOutcome;

  @Column('decimal', { precision: 5, scale: 2 })
  creditScore: number; // 0-100 or 300-850 scale

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  debtToIncomeRatio: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  approvedAmount: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  approvedInterestRate: number;

  @Column({ type: 'int', nullable: true })
  approvedTerm: number; // in months

  @Column({ type: 'text', nullable: true })
  decisionRationale: string; // Why this decision was made

  @Column({ type: 'json', nullable: true })
  riskFactors: Record<string, any>; // Key risk factors identified

  @Column({ type: 'json', nullable: true })
  scoringFactors: Record<string, any>; // Factors that contributed to score

  @Column({ nullable: true })
  decisionBy: string; // User ID who made the decision

  @Column({ type: 'timestamp' })
  decisionDate: Date;

  @Column({ type: 'text', nullable: true })
  conditions: string; // Conditions for conditional approval

  @Column({ type: 'boolean', default: false })
  isOverride: boolean; // Whether this is an override decision

  @Column({ nullable: true })
  overrideJustification: string; // Justification for override

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

