import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { Currency } from '../../currency/entities/currency.entity';

@Entity('loan_disbursements')
@Index(['loanId'])
@Index(['disbursementDate'])
export class LoanDisbursement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan, (loan) => loan.disbursements)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'date' })
  disbursementDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  disbursedAmount: number;

  @Column({ type: 'uuid', nullable: true })
  currencyId: string | null; // Disbursement currency

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'currencyId' })
  currency: Currency | null;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  disbursedAmountBaseCurrency: number | null; // Amount in base currency

  @Column('decimal', { precision: 18, scale: 6, nullable: true })
  exchangeRate: number | null; // Exchange rate used for conversion

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ nullable: true })
  modeOfPayment: string;

  @CreateDateColumn()
  createdAt: Date;
}

