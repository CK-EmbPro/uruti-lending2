import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';

@Entity('loan_transfers')
@Index(['loanId'])
@Index(['transferDate'])
export class LoanTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({
    type: 'enum',
    enum: ApplicantType,
  })
  oldApplicantType: ApplicantType;

  @Column()
  oldApplicantId: string;

  @Column({
    type: 'enum',
    enum: ApplicantType,
  })
  newApplicantType: ApplicantType;

  @Column()
  newApplicantId: string;

  @Column({ type: 'date' })
  transferDate: Date;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  transferredBy: string; // User ID who performed the transfer

  @CreateDateColumn()
  createdAt: Date;
}

