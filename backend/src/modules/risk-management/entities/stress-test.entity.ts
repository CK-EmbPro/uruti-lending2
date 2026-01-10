import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StressTestType {
  REGULATORY = 'REGULATORY',
  CUSTOM = 'CUSTOM',
  BASELINE = 'BASELINE',
  ADVERSE = 'ADVERSE',
  SEVERELY_ADVERSE = 'SEVERELY_ADVERSE',
}

export enum StressTestStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('stress_tests')
@Index(['testDate'])
@Index(['testType'])
@Index(['status'])
export class StressTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  testName: string;

  @Column({
    type: 'enum',
    enum: StressTestType,
    default: StressTestType.CUSTOM,
  })
  testType: StressTestType;

  @Column({ type: 'date' })
  testDate: Date;

  @Column({
    type: 'enum',
    enum: StressTestStatus,
    default: StressTestStatus.DRAFT,
  })
  status: StressTestStatus;

  @Column({ nullable: true })
  companyId: string;

  // Scenario Parameters (JSON)
  @Column('jsonb', { nullable: true })
  scenarioParameters: any; // e.g., { defaultRate: 0.05, lossRate: 0.03, interestRateShock: 0.02 }

  // Portfolio Snapshot
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  portfolioTotal: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalOutstanding: number;

  @Column('int', { default: 0 })
  totalLoans: number;

  // Stress Test Results
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  projectedDefaults: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  projectedLosses: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  defaultRate: number; // Percentage

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  lossRate: number; // Percentage

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  capitalRequired: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  capitalAvailable: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  capitalAdequacyRatio: number; // Percentage

  // Detailed Results (JSON)
  @Column('jsonb', { nullable: true })
  resultsBySegment: any; // Breakdown by product, geography, etc.

  @Column('jsonb', { nullable: true })
  sensitivityAnalysis: any; // Sensitivity to parameter changes

  // Execution Details
  @Column({ nullable: true })
  executedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column('int', { nullable: true })
  executionTimeMs: number; // Execution time in milliseconds

  @Column('text', { nullable: true })
  errorMessage: string;

  @Column('text', { nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

