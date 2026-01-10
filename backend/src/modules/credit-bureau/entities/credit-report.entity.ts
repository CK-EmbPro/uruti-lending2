import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CreditBureauProvider {
  EXPERIAN = 'EXPERIAN',
  EQUIFAX = 'EQUIFAX',
  TRANSUNION = 'TRANSUNION',
  MULTI_BUREAU = 'MULTI_BUREAU',
}

export enum CreditReportStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

@Entity('credit_reports')
@Index(['companyId', 'customerId'])
@Index(['applicationId'])
@Index(['status'])
@Index(['pulledAt'])
export class CreditReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  customerId: string;

  @Column()
  applicationId: string;

  @Column({
    type: 'enum',
    enum: CreditBureauProvider,
  })
  provider: CreditBureauProvider;

  @Column({
    type: 'enum',
    enum: CreditReportStatus,
    default: CreditReportStatus.PENDING,
  })
  status: CreditReportStatus;

  @Column({ type: 'int', nullable: true })
  creditScore: number;

  @Column({ type: 'json', nullable: true })
  scoreRange: { min: number; max: number };

  @Column({ type: 'json', nullable: true })
  creditFactors: {
    paymentHistory: number;
    creditUtilization: number;
    creditAge: number;
    creditMix: number;
    newCredit: number;
  };

  @Column({ type: 'json', nullable: true })
  accountsSummary: {
    totalAccounts: number;
    openAccounts: number;
    closedAccounts: number;
    totalDebt: number;
    availableCredit: number;
    creditUtilization: number;
  };

  @Column({ type: 'json', nullable: true })
  paymentHistory: {
    onTimePayments: number;
    latePayments30: number;
    latePayments60: number;
    latePayments90: number;
    collections: number;
    bankruptcies: number;
  };

  @Column({ type: 'json', default: [] })
  inquiries: Array<{
    date: string;
    creditor: string;
    type: string;
  }>;

  @Column({ type: 'json', default: [] })
  publicRecords: Array<{
    type: string;
    date: string;
    amount: number;
    status: string;
  }>;

  @Column({ type: 'json', nullable: true })
  rawReportData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  pulledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // Reports typically valid for 30-90 days

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

