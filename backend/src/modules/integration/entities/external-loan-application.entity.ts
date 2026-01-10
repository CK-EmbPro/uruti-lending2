import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ThirdPartyPlatform } from './third-party-platform.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';

export enum ExternalApplicationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  DISBURSED = 'Disbursed',
  REPAID = 'Repaid',
  PARTIAL = 'Partial',
}

@Entity('external_loan_applications')
@Index(['platformId'])
@Index(['externalReferenceId', 'platformId'], { unique: true })
@Index(['loanApplicationId'])
@Index(['loanId'])
@Index(['status'])
export class ExternalLoanApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  platformId: string;

  @ManyToOne(() => ThirdPartyPlatform, (platform) => platform.externalApplications)
  platform: ThirdPartyPlatform;

  @Column({ unique: true })
  externalReferenceId: string; // External system's reference (e.g., trip ID, order ID)

  @Column({ nullable: true })
  externalCustomerId: string; // External system's customer ID

  @Column({ nullable: true })
  loanApplicationId: string; // Link to internal loan application

  @ManyToOne(() => LoanApplication, { nullable: true })
  loanApplication: LoanApplication;

  @Column({ nullable: true })
  loanId: string; // Link to created loan

  @ManyToOne(() => Loan, { nullable: true })
  loan: Loan;

  @Column({
    type: 'enum',
    enum: ExternalApplicationStatus,
    default: ExternalApplicationStatus.PENDING,
  })
  status: ExternalApplicationStatus;

  // Trip Financing Specific Fields
  @Column({ nullable: true })
  tripId: string; // Trip ID from UrutiX

  @Column({ nullable: true })
  cargoOwnerId: string; // Cargo owner ID

  @Column({ nullable: true })
  transporterId: string; // Transporter ID

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  tripRevenue: number; // Expected trip revenue

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  advanceAmount: number; // Advance payment requested

  @Column({ type: 'date', nullable: true })
  tripStartDate: Date;

  @Column({ type: 'date', nullable: true })
  tripEndDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedRevenueDate: Date;

  // Webhook Tracking
  @Column({ type: 'timestamp', nullable: true })
  lastWebhookSentAt: Date;

  @Column({ type: 'int', default: 0 })
  webhookAttempts: number;

  @Column({ type: 'text', nullable: true })
  lastWebhookResponse: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  externalData: Record<string, any>; // Additional data from external system

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Internal metadata

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

