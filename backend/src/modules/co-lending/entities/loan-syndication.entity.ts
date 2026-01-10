import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanPartner } from '../../loan-partner/entities/loan-partner.entity';

export enum SyndicationStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FULLY_FILLED = 'FULLY_FILLED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum SyndicationType {
  LEAD_LENDER = 'LEAD_LENDER',
  EQUAL_SHARE = 'EQUAL_SHARE',
  CUSTOM_ALLOCATION = 'CUSTOM_ALLOCATION',
}

@Entity('loan_syndications')
@Index(['loanId', 'status'])
@Index(['status', 'createdAt'])
export class LoanSyndication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({ type: 'enum', enum: SyndicationStatus, default: SyndicationStatus.DRAFT })
  status: SyndicationStatus;

  @Column({ type: 'enum', enum: SyndicationType })
  syndicationType: SyndicationType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalAmount: number; // Total amount to be syndicated

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  committedAmount: number; // Amount committed by lenders

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  availableAmount: number; // Amount still available

  @Column({ type: 'uuid', nullable: true })
  leadLenderId: string | null; // Lead lender (if applicable)

  @ManyToOne(() => LoanPartner, { nullable: true })
  @JoinColumn({ name: 'leadLenderId' })
  leadLender: LoanPartner | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  leadLenderSharePercentage: number | null; // Lead lender's share

  @Column({ type: 'date', nullable: true })
  syndicationDeadline: Date | null; // Deadline for lenders to commit

  @Column({ type: 'date', nullable: true })
  fundingDate: Date | null; // Expected funding date

  @Column({ type: 'text', nullable: true })
  terms: string | null; // Syndication terms and conditions

  @Column({ type: 'json', nullable: true })
  riskSharing: Record<string, any>; // Risk sharing agreement details

  @Column({ type: 'json', nullable: true })
  revenueSharing: Record<string, any>; // Revenue sharing agreement details

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => LoanSyndicationParticipant, (participant) => participant.syndication)
  participants: LoanSyndicationParticipant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('loan_syndication_participants')
@Index(['syndicationId', 'lenderId'], { unique: true })
@Index(['lenderId', 'status'])
export class LoanSyndicationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  syndicationId: string;

  @ManyToOne(() => LoanSyndication, (syndication) => syndication.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'syndicationId' })
  syndication: LoanSyndication;

  @Column({ type: 'uuid' })
  lenderId: string;

  @ManyToOne(() => LoanPartner)
  @JoinColumn({ name: 'lenderId' })
  lender: LoanPartner;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  committedAmount: number; // Amount committed by this lender

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  sharePercentage: number; // This lender's share percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  interestRate: number | null; // Lender's interest rate

  @Column({ type: 'enum', enum: ['PENDING', 'COMMITTED', 'FUNDED', 'WITHDRAWN'], default: 'PENDING' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  committedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  fundedAt: Date | null;

  @Column({ type: 'json', nullable: true })
  terms: Record<string, any>; // Lender-specific terms

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

