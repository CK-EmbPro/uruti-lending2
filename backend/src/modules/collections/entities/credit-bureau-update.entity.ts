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
import { DelinquencyRecord } from './delinquency-record.entity';

@Entity('credit_bureau_updates')
@Index(['loanId'])
@Index(['updateDate'])
export class CreditBureauUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => DelinquencyRecord, { nullable: true })
  delinquencyRecord: DelinquencyRecord;

  @Column({ nullable: true })
  delinquencyRecordId: string;

  @Column({ type: 'date' })
  updateDate: Date;

  @Column({ type: 'int' })
  daysPastDue: number;

  @Column({ nullable: true })
  creditBureau: string; // Experian, Equifax, TransUnion

  @Column({ nullable: true })
  statusCode: string; // Current, 30, 60, 90, 120, Charge-Off

  @Column({ type: 'boolean', default: false })
  submitted: boolean;

  @Column({ type: 'date', nullable: true })
  submittedDate: Date;

  @Column({ nullable: true })
  submissionReference: string;

  @Column({ type: 'boolean', default: false })
  confirmed: boolean;

  @Column({ type: 'date', nullable: true })
  confirmedDate: Date;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

