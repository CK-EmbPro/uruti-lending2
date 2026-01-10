import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanDisbursement } from '../../loan-disbursement/entities/loan-disbursement.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';

export enum ChargePostingType {
  DISBURSEMENT = 'Disbursement',
  REPAYMENT = 'Repayment',
}

export enum ChargePostingStatus {
  PENDING = 'Pending',
  POSTED = 'Posted',
  CANCELLED = 'Cancelled',
}

@Entity('loan_charge_postings')
@Index(['loanId'])
@Index(['postingType'])
@Index(['status'])
export class LoanChargePosting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({
    type: 'enum',
    enum: ChargePostingType,
  })
  postingType: ChargePostingType;

  @ManyToOne(() => LoanDisbursement, { nullable: true })
  loanDisbursement: LoanDisbursement;

  @Column({ nullable: true })
  loanDisbursementId: string;

  @ManyToOne(() => LoanRepayment, { nullable: true })
  loanRepayment: LoanRepayment;

  @Column({ nullable: true })
  loanRepaymentId: string;

  @Column()
  chargeType: string; // Charge code/item reference

  @Column('decimal', { precision: 15, scale: 2 })
  chargeAmount: number;

  @Column({ nullable: true })
  incomeAccount: string; // Income account for the charge

  @Column({ nullable: true })
  receivableAccount: string; // Receivable account

  @Column({ type: 'date' })
  postingDate: Date;

  @Column({ type: 'date' })
  valueDate: Date;

  @Column({
    type: 'enum',
    enum: ChargePostingStatus,
    default: ChargePostingStatus.PENDING,
  })
  status: ChargePostingStatus;

  @Column({ nullable: true })
  journalEntryId: string; // Reference to journal entry when accounting is implemented

  @Column({ nullable: true })
  salesInvoiceId: string; // Reference to sales invoice (Frappe pattern)

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

