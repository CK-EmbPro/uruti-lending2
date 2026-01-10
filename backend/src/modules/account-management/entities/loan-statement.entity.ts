import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';

export enum StatementType {
  MONTHLY = 'Monthly',
  ANNUAL = 'Annual',
  ON_DEMAND = 'On-Demand',
  PAYOFF = 'Payoff',
}

export enum StatementStatus {
  GENERATED = 'Generated',
  SENT = 'Sent',
  DELIVERED = 'Delivered',
  FAILED = 'Failed',
}

export enum DeliveryMethod {
  EMAIL = 'Email',
  MAIL = 'Mail',
  ELECTRONIC_ONLY = 'Electronic Only',
  BOTH = 'Both',
}

@Entity('loan_statements')
@Index(['loanId'])
@Index(['statementDate'])
@Index(['status'])
export class LoanStatement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({
    type: 'enum',
    enum: StatementType,
    default: StatementType.MONTHLY,
  })
  statementType: StatementType;

  @Column({ type: 'date' })
  statementDate: Date;

  @Column({ type: 'date' })
  periodStartDate: Date;

  @Column({ type: 'date' })
  periodEndDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  openingBalance: number;

  @Column('decimal', { precision: 15, scale: 2 })
  closingBalance: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  principalPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  interestPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  penaltyPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  interestAccrued: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  principalReduction: number;

  @Column({
    type: 'enum',
    enum: StatementStatus,
    default: StatementStatus.GENERATED,
  })
  status: StatementStatus;

  @Column({
    type: 'enum',
    enum: DeliveryMethod,
    default: DeliveryMethod.EMAIL,
  })
  deliveryMethod: DeliveryMethod;

  @Column({ type: 'text', nullable: true })
  filePath: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;
}














