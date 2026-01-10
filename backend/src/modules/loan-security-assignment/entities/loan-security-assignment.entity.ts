import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';
import { Pledge } from './pledge.entity';

export enum LoanSecurityAssignmentStatus {
  PLEDGE_REQUESTED = 'Pledge Requested',
  UNPLEDGED = 'Unpledged',
  PLEDGED = 'Pledged',
  RELEASE_REQUESTED = 'Release Requested',
  RELEASED = 'Released',
  REPOSSESSED = 'Repossessed',
  CANCELLED = 'Cancelled',
}

@Entity('loan_security_assignments')
@Index(['loanId'])
@Index(['loanApplicationId'])
@Index(['status'])
@Index(['applicantId', 'applicantType'])
export class LoanSecurityAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan, { nullable: true })
  loan: Loan;

  @Column({ nullable: true })
  loanId: string;

  @ManyToOne(() => LoanApplication, { nullable: true })
  loanApplication: LoanApplication;

  @Column({ nullable: true })
  loanApplicationId: string;

  @Column({
    type: 'enum',
    enum: ApplicantType,
  })
  applicantType: ApplicantType;

  @Column()
  applicantId: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: LoanSecurityAssignmentStatus,
    default: LoanSecurityAssignmentStatus.PLEDGE_REQUESTED,
  })
  status: LoanSecurityAssignmentStatus;

  @Column({ type: 'timestamp', nullable: true })
  pledgeTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  releaseTime: Date;

  @OneToMany(() => Pledge, (pledge) => pledge.loanSecurityAssignment, {
    cascade: true,
    eager: false,
  })
  pledges: Pledge[];

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalSecurityValue: number; // Sum of all pledge amounts

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  maximumLoanValue: number; // Sum of all post-haircut amounts

  @Column({ nullable: true })
  referenceNo: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

