import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('portfolio_metrics')
@Index(['reportDate'])
@Index(['companyId'])
export class PortfolioMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  reportDate: Date;

  @Column({ nullable: true })
  companyId: string;

  @Column({ nullable: true })
  loanProductId: string;

  // Volume Metrics
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalLoans: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalDisbursed: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalOutstanding: number;

  // Delinquency Metrics
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalDelinquentLoans: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalDelinquentAmount: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  delinquencyRate: number; // Percentage

  // Profitability Metrics
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalInterestEarned: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalFeesEarned: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalWriteOffs: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  netProfitMargin: number; // Percentage

  // Segment Breakdown (JSON)
  @Column('jsonb', { nullable: true })
  byProduct: any;

  @Column('jsonb', { nullable: true })
  byStatus: any;

  @Column('jsonb', { nullable: true })
  byDelinquencyStage: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

