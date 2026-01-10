import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum HealthScoreStatus {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  CRITICAL = 'CRITICAL',
}

@Entity('financial_health_scores')
@Index(['customerId', 'calculatedAt'])
@Index(['applicationId'])
export class FinancialHealthScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @Column({ type: 'int' })
  score: number; // 0-100

  @Column({ type: 'enum', enum: HealthScoreStatus })
  status: HealthScoreStatus;

  // Income Analysis
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  averageMonthlyIncome: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  incomeStability: number | null; // 0-100, based on income consistency

  @Column({ type: 'int', nullable: true })
  incomeMonthsTracked: number | null;

  // Spending Analysis
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  averageMonthlyExpenses: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  savingsRate: number | null; // Percentage of income saved

  // Cash Flow Analysis
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  averageMonthlyCashFlow: number | null;

  @Column({ type: 'int', nullable: true })
  negativeCashFlowMonths: number | null;

  // Debt Analysis
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalDebt: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  debtToIncomeRatio: number | null;

  // Risk Indicators
  @Column({ type: 'json', nullable: true })
  riskIndicators: Record<string, any>; // Array of risk factors

  @Column({ type: 'json', nullable: true })
  positiveIndicators: Record<string, any>; // Array of positive factors

  @Column({ type: 'text', nullable: true })
  explanation: string | null; // Human-readable explanation

  @Column({ type: 'json', nullable: true })
  recommendations: Record<string, any>; // Recommendations for improvement

  @Column({ type: 'timestamp' })
  calculatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

