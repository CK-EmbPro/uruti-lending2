import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('reconciliation_runs')
@Index(['reconciliationDate'])
@Index(['status'])
export class ReconciliationRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  reconciliationDate: Date;

  @Column({ type: 'int', default: 0 })
  totalLedgerEntries: number;

  @Column({ type: 'int', default: 0 })
  totalBankTransactions: number;

  @Column({ type: 'int', default: 0 })
  matchedEntries: number;

  @Column({ type: 'int', default: 0 })
  unmatchedLedgerEntries: number;

  @Column({ type: 'int', default: 0 })
  unmatchedBankTransactions: number;

  @Column({ length: 20, default: 'PENDING' })
  status: string; // PENDING, IN_PROGRESS, COMPLETED, FAILED

  @Column({ type: 'jsonb', nullable: true })
  discrepancies: string[];

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}

