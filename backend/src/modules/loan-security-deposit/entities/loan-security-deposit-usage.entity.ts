import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';

export enum SecurityDepositUsageType {
  INTEREST_PAYMENT = 'Interest Payment',
  PENALTY_PAYMENT = 'Penalty Payment',
  PRINCIPAL_PAYMENT = 'Principal Payment',
  CHARGES_PAYMENT = 'Charges Payment',
  LOAN_CLOSURE = 'Loan Closure',
  OTHER = 'Other',
}

@Entity('loan_security_deposit_usages')
@Index(['loanId', 'usageDate'])
export class LoanSecurityDepositUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  loanId: string;

  @ManyToOne(() => Loan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({
    type: 'enum',
    enum: SecurityDepositUsageType,
  })
  usageType: SecurityDepositUsageType;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number; // Amount used from security deposit

  @Column({ type: 'date' })
  usageDate: Date; // Date when security deposit was used

  @Column({ nullable: true })
  referenceDocumentType: string; // Type of document (e.g., Loan Repayment, Loan Closure)

  @Column({ nullable: true })
  referenceDocumentId: string; // ID of the reference document

  @Column({ nullable: true })
  referenceNumber: string; // Reference number

  @Column({ type: 'text', nullable: true })
  remarks: string; // Usage remarks

  @Column({ nullable: true })
  usedBy: string; // User ID who used the deposit

  @Column('decimal', { precision: 15, scale: 2 })
  balanceBefore: number; // Security deposit balance before this usage

  @Column('decimal', { precision: 15, scale: 2 })
  balanceAfter: number; // Security deposit balance after this usage

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

