import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WhiteLabelConfiguration } from './white-label.entity';

export enum TransactionType {
  LOAN_ORIGINATION = 'LOAN_ORIGINATION',
  INTEREST_PAYMENT = 'INTEREST_PAYMENT',
  PROCESSING_FEE = 'PROCESSING_FEE',
  LATE_FEE = 'LATE_FEE',
  OTHER = 'OTHER',
}

@Entity('revenue_share_transactions')
@Index(['whiteLabelId'])
@Index(['transactionDate'])
@Index(['transactionType'])
@Index(['loanId'])
export class RevenueShareTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  whiteLabelId: string;

  @ManyToOne(() => WhiteLabelConfiguration)
  @JoinColumn({ name: 'whiteLabelId' })
  whiteLabel: WhiteLabelConfiguration;

  @Column({ nullable: true })
  loanId: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column('decimal', { precision: 15, scale: 2 })
  transactionAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  partnerShare: number;

  @Column('decimal', { precision: 15, scale: 2 })
  platformShare: number;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  calculationDetails: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isSettled: boolean;

  @Column({ type: 'date', nullable: true })
  settledDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  createdBy: string;
}

