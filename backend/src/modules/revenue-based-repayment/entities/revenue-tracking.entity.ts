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

export enum RevenueSource {
  PAYMENT_GATEWAY = 'PAYMENT_GATEWAY',
  ACCOUNTING_SYSTEM = 'ACCOUNTING_SYSTEM',
  BANK_STATEMENT = 'BANK_STATEMENT',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  API_INTEGRATION = 'API_INTEGRATION',
}

export enum RevenueStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  DISCREPANCY = 'DISCREPANCY',
  REJECTED = 'REJECTED',
}

@Entity('revenue_tracking')
@Index(['loanId'])
@Index(['revenueDate'])
@Index(['source'])
@Index(['status'])
export class RevenueTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column()
  companyId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  revenueAmount: number;

  @Column({ type: 'date' })
  revenueDate: Date;

  @Column({
    type: 'enum',
    enum: RevenueSource,
  })
  source: RevenueSource;

  @Column({ nullable: true })
  sourceIntegrationId: string; // ID of integration that provided this data

  @Column({ nullable: true })
  externalReferenceId: string; // Reference ID from external system

  @Column({
    type: 'enum',
    enum: RevenueStatus,
    default: RevenueStatus.PENDING,
  })
  status: RevenueStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional data from source

  @Column({ type: 'jsonb', nullable: true })
  verificationData: {
    bankStatementAmount?: number;
    bankStatementDate?: Date;
    discrepancy?: number;
    verifiedBy?: string;
    verifiedAt?: Date;
    notes?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

