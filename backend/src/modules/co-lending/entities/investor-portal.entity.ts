import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum InvestorStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

export enum InvestorType {
  INDIVIDUAL = 'INDIVIDUAL',
  INSTITUTIONAL = 'INSTITUTIONAL',
  ACCREDITED = 'ACCREDITED',
}

@Entity('investors')
@Index(['email'], { unique: true })
@Index(['status', 'investorType'])
export class Investor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  investorCode: string; // Unique investor code

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: InvestorType })
  investorType: InvestorType;

  @Column({ type: 'enum', enum: InvestorStatus, default: InvestorStatus.PENDING_VERIFICATION })
  status: InvestorStatus;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalInvested: number; // Total amount invested

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  availableBalance: number; // Available balance for investing

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalReturns: number; // Total returns earned

  @Column({ type: 'int', default: 0 })
  activeInvestments: number; // Number of active investments

  @Column({ type: 'json', nullable: true })
  kycData: Record<string, any>; // KYC verification data

  @Column({ type: 'json', nullable: true })
  riskProfile: Record<string, any>; // Risk tolerance, preferences

  @Column({ type: 'json', nullable: true })
  preferences: Record<string, any>; // Investment preferences

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('investor_portfolios')
@Index(['investorId', 'status'])
export class InvestorPortfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  investorId: string;

  @Column({ type: 'uuid' })
  loanId: string; // Loan in which investor has participated

  @Column({ type: 'uuid', nullable: true })
  syndicationId: string | null;

  @Column({ type: 'uuid', nullable: true })
  listingId: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  investedAmount: number; // Amount invested

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  sharePercentage: number; // Share percentage in the loan

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  principalReceived: number; // Principal received so far

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  interestReceived: number; // Interest received so far

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalReturns: number; // Total returns (principal + interest)

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  outstandingPrincipal: number; // Outstanding principal

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  accruedInterest: number; // Accrued but not yet received interest

  @Column({ type: 'enum', enum: ['ACTIVE', 'CLOSED', 'DEFAULTED'], default: 'ACTIVE' })
  status: string;

  @Column({ type: 'date' })
  investmentDate: Date;

  @Column({ type: 'date', nullable: true })
  maturityDate: Date | null;

  @Column({ type: 'json', nullable: true })
  performanceMetrics: Record<string, any>; // ROI, yield, etc.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

