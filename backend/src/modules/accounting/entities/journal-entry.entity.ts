import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { GlEntry } from './gl-entry.entity';

export enum JournalEntryStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  CANCELLED = 'Cancelled',
}

export enum VoucherType {
  JOURNAL_ENTRY = 'Journal Entry',
  DISBURSEMENT = 'Disbursement',
  REPAYMENT = 'Repayment',
  WRITE_OFF = 'Write Off',
  REFUND = 'Refund',
  ADJUSTMENT = 'Adjustment',
}

@Entity('journal_entries')
@Index(['companyId'])
@Index(['postingDate'])
@Index(['voucherType'])
@Index(['status'])
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  voucherNo: string; // Auto-generated voucher number

  @Column({
    type: 'enum',
    enum: VoucherType,
    default: VoucherType.JOURNAL_ENTRY,
  })
  voucherType: VoucherType;

  @Column()
  companyId: string;

  @Column({ type: 'date' })
  postingDate: Date;

  @Column({ type: 'date' })
  valueDate: Date;

  @Column({
    type: 'enum',
    enum: JournalEntryStatus,
    default: JournalEntryStatus.DRAFT,
  })
  status: JournalEntryStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  referenceType: string; // Loan, Loan Disbursement, Loan Repayment, etc.

  @Column({ nullable: true })
  referenceId: string; // ID of the referenced document

  @Column({ nullable: true })
  costCenter: string;

  @OneToMany(() => GlEntry, (glEntry) => glEntry.journalEntry, {
    cascade: true,
  })
  glEntries: GlEntry[];

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalDebit: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalCredit: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

