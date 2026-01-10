import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TransactionType, LedgerEntryStatus } from '../dto/reconciliation.dto';

@Entity('ledger_entries')
@Index(['referenceNumber'])
@Index(['loanId'])
@Index(['customerId'])
@Index(['status'])
@Index(['transactionType'])
@Index(['createdAt'])
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: '50' })
  transactionType: TransactionType;

  @Column()
  debitAccount: string; // Account code

  @Column()
  creditAccount: string; // Account code

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  exchangeRate?: number;

  @Column()
  referenceNumber: string;

  @Column({ nullable: true })
  loanId?: string;

  @Column({ nullable: true })
  customerId?: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: '20', default: 'PENDING' })
  status: LedgerEntryStatus;

  @Column()
  createdBy: string; // User ID

  @Column()
  source: string; // Source system

  @Column({ type: 'timestamp', nullable: true })
  postedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

