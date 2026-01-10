import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanDocument } from './loan-document.entity';

export enum BookingStatus {
  PENDING = 'Pending',
  DOCUMENTS_GENERATED = 'Documents Generated',
  PENDING_SIGNATURES = 'Pending Signatures',
  SIGNATURES_COMPLETE = 'Signatures Complete',
  BOOKED = 'Booked',
  CANCELLED = 'Cancelled',
}

@Entity('loan_bookings')
@Index(['loanId'])
@Index(['applicationId'])
@Index(['status'])
export class LoanBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column()
  applicationId: string;

  @ManyToOne(() => LoanApplication)
  @JoinColumn({ name: 'applicationId' })
  application: LoanApplication;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ nullable: true })
  bookedBy: string; // Loan Officer user ID

  @Column({ type: 'date', nullable: true })
  bookedDate: Date;

  @Column({ type: 'text', nullable: true })
  bookingRemarks: string;

  @Column({ type: 'boolean', default: false })
  requiresNotarization: boolean;

  @Column({ type: 'boolean', default: false })
  accountCreated: boolean;

  @Column({ nullable: true })
  accountNumber: string; // Created loan account number

  @Column({ type: 'json', nullable: true })
  accountDetails: Record<string, any>; // Account creation details

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  cancelledBy: string;

  @Column({ type: 'date', nullable: true })
  cancelledDate: Date;

  @OneToMany(() => LoanDocument, (document) => document.loan, { cascade: true })
  documents: LoanDocument[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

