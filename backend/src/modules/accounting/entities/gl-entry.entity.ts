import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { JournalEntry } from './journal-entry.entity';

@Entity('gl_entries')
@Index(['account'])
@Index(['postingDate'])
@Index(['voucherType', 'voucherNo'])
@Index(['referenceType', 'referenceId'])
export class GlEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => JournalEntry, (journalEntry) => journalEntry.glEntries, {
    onDelete: 'CASCADE',
  })
  journalEntry: JournalEntry;

  @Column()
  journalEntryId: string;

  @Column()
  account: string; // Account code/ID

  @Column({ nullable: true })
  accountName: string; // Account name for reference

  @Column({ nullable: true })
  againstAccount: string; // Against account

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  debit: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  credit: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  debitInAccountCurrency: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  creditInAccountCurrency: number;

  @Column({ nullable: true })
  voucherType: string; // Journal Entry, Disbursement, Repayment, etc.

  @Column({ nullable: true })
  voucherNo: string; // Voucher number

  @Column({ nullable: true })
  referenceType: string; // Loan, Loan Disbursement, etc.

  @Column({ nullable: true })
  referenceId: string; // ID of the referenced document

  @Column({ nullable: true })
  partyType: string; // Customer, Employee, Member

  @Column({ nullable: true })
  party: string; // Party ID

  @Column({ type: 'date' })
  postingDate: Date;

  @Column({ nullable: true })
  costCenter: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}

