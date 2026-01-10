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
import { Company } from '../../company/entities/company.entity';

export enum AdjustmentType {
  CREDIT_ADJUSTMENT = 'Credit Adjustment',
  DEBIT_ADJUSTMENT = 'Debit Adjustment',
}

export enum ReferenceDocumentType {
  LOAN_REPAYMENT = 'Loan Repayment',
  LOAN_RESTRUCTURE = 'Loan Restructure',
}

@Entity('loan_balance_adjustments')
@Index(['loanId'])
@Index(['postingDate'])
@Index(['companyId'])
export class LoanBalanceAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => Company)
  company: Company;

  @Column()
  companyId: string;

  @Column({ type: 'date' })
  postingDate: Date;

  @Column({
    type: 'enum',
    enum: AdjustmentType,
  })
  adjustmentType: AdjustmentType;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column()
  adjustmentAccount: string;

  @Column({ nullable: true })
  adjustmentReceivableAccount: string;

  @Column({ nullable: true })
  costCenter: string;

  @Column({
    type: 'enum',
    enum: ReferenceDocumentType,
    nullable: true,
  })
  referenceDocumentType: ReferenceDocumentType;

  @Column({ nullable: true })
  referenceName: string;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  applicantType: string;

  @Column({ nullable: true })
  applicantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

