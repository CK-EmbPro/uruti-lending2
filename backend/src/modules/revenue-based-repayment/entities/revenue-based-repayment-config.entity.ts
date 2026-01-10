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
import { Loan } from '../../loan/entities/loan.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';

export enum RevenuePeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

@Entity('revenue_based_repayment_config')
@Index(['loanId'], { unique: true })
@Index(['loanProductId'])
export class RevenueBasedRepaymentConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  loanId: string; // Loan-specific config (nullable for product-level defaults)

  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({ nullable: true })
  loanProductId: string; // Product-level default config

  @ManyToOne(() => LoanProduct, { nullable: true })
  @JoinColumn({ name: 'loanProductId' })
  loanProduct: LoanProduct;

  @Column()
  companyId: string;

  // Repayment calculation
  @Column('decimal', { precision: 5, scale: 2 })
  repaymentPercentage: number; // Percentage of revenue to use for repayment (e.g., 10.5 for 10.5%)

  @Column({
    type: 'enum',
    enum: RevenuePeriod,
    default: RevenuePeriod.MONTHLY,
  })
  revenuePeriod: RevenuePeriod; // How often to calculate repayment

  // Floor and Ceiling
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minimumRepaymentAmount: number; // Floor - minimum repayment regardless of revenue

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maximumRepaymentAmount: number; // Ceiling - maximum repayment per period

  // Integration settings
  @Column({ type: 'jsonb', nullable: true })
  revenueSources: {
    paymentGateway?: string[]; // Integration IDs for payment gateways
    accountingSystem?: string[]; // Integration IDs for accounting systems
    bankAccount?: string[]; // Bank account IDs for statement verification
  };

  @Column({ type: 'boolean', default: true })
  requireVerification: boolean; // Require bank statement verification

  @Column({ type: 'boolean', default: true })
  autoCalculate: boolean; // Automatically calculate and create repayments

  @Column({ type: 'int', nullable: true })
  verificationThreshold: number; // Percentage difference to flag as discrepancy (default: 5%)

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

