import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ReportPeriod {
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
  MONTHLY = 'MONTHLY',
}

@Entity('override_performance_reports')
@Index(['companyId'])
@Index(['reportPeriod', 'periodStart'])
@Index(['generatedAt'])
export class OverridePerformanceReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: ReportPeriod,
    default: ReportPeriod.QUARTERLY,
  })
  reportPeriod: ReportPeriod;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ nullable: true })
  generatedBy: string; // User ID who generated the report

  @Column({ type: 'timestamp' })
  generatedAt: Date;

  // Summary Metrics
  @Column({ type: 'int' })
  totalOverrides: number; // Total number of overrides in period

  @Column({ type: 'int' })
  totalModelDecisions: number; // Total number of model decisions in period

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalOverrideAmount: number; // Total amount overridden

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalModelAmount: number; // Total amount from model decisions

  // Override Performance
  @Column({ type: 'int' })
  overrideApproved: number; // Number of overrides that were approved

  @Column({ type: 'int' })
  overrideSuccessful: number; // Number of successful overrides (loans repaid)

  @Column({ type: 'int' })
  overrideDefaulted: number; // Number of overrides that defaulted

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overrideSuccessRate: number; // % of overrides that were successful

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overrideDefaultRate: number; // % of overrides that defaulted

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  overrideTotalRepaid: number; // Total amount repaid from overrides

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  overrideTotalDefaulted: number; // Total amount defaulted from overrides

  // Model Performance
  @Column({ type: 'int' })
  modelApproved: number; // Number of model decisions that were approved

  @Column({ type: 'int' })
  modelSuccessful: number; // Number of successful model decisions

  @Column({ type: 'int' })
  modelDefaulted: number; // Number of model decisions that defaulted

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  modelSuccessRate: number; // % of model decisions that were successful

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  modelDefaultRate: number; // % of model decisions that defaulted

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  modelTotalRepaid: number; // Total amount repaid from model decisions

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  modelTotalDefaulted: number; // Total amount defaulted from model decisions

  // Accuracy Comparison
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overrideAccuracy: number; // % of overrides that were correct

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  modelAccuracy: number; // % of model decisions that were correct

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  accuracyDifference: number; // Override accuracy - Model accuracy

  // Performance by Tier
  @Column({ type: 'jsonb', nullable: true })
  performanceByTier: {
    tier: string;
    overrideCount: number;
    overrideSuccessRate: number;
    overrideDefaultRate: number;
    modelCount: number;
    modelSuccessRate: number;
    modelDefaultRate: number;
  }[];

  // Performance by Approver
  @Column({ type: 'jsonb', nullable: true })
  performanceByApprover: {
    approverId: string;
    approverName: string;
    overrideCount: number;
    successRate: number;
    defaultRate: number;
  }[];

  // Detailed Breakdown
  @Column({ type: 'jsonb', nullable: true })
  detailedMetrics: {
    averageDaysToDefault: number;
    averageDaysToRepayment: number;
    averageOverrideAmount: number;
    averageModelAmount: number;
    profitFromOverrides: number;
    profitFromModel: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

