import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { Currency } from '../../currency/entities/currency.entity';
import { RepaymentType } from '../../../common/enums/repayment-type.enum';
import { PrepaymentCharge } from './prepayment-charge.entity';

@Entity('loan_repayments')
@Index(['loanId'])
@Index(['postingDate'])
export class LoanRepayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan, (loan) => loan.repayments)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'date' })
  postingDate: Date;

  @Column({ type: 'date', nullable: true })
  valueDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  amountPaid: number;

  @Column({ type: 'uuid', nullable: true })
  paymentCurrencyId: string | null; // Currency in which payment was made

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'paymentCurrencyId' })
  paymentCurrency: Currency | null;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  amountPaidBaseCurrency: number | null; // Amount in base currency

  @Column('decimal', { precision: 18, scale: 6, nullable: true })
  exchangeRate: number | null; // Exchange rate used for conversion

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  principalPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  interestPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  penaltyPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  chargesPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  excessAmount: number;

  @Column({
    type: 'enum',
    enum: RepaymentType,
    default: RepaymentType.NORMAL_REPAYMENT,
  })
  repaymentType: RepaymentType;

  @Column({ nullable: true })
  modeOfPayment: string;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  prepaymentChargesTotal: number; // Total prepayment charges

  @Column({ type: 'date', nullable: true })
  dueDate: Date; // Due date for the repayment (from schedule)

  @Column({ nullable: true, default: 'PENDING' })
  status: string; // Payment status (PENDING, PAID, PARTIAL, etc.)

  @OneToMany(() => PrepaymentCharge, (charge) => charge.loanRepayment, {
    cascade: true,
    eager: false,
  })
  prepaymentCharges: PrepaymentCharge[];

  @CreateDateColumn()
  createdAt: Date;
}

