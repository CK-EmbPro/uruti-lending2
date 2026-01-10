import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
// Customer entity - using string reference for migration compatibility
// import { Customer } from '../../customer/entities/customer.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

export enum ReferralStatus {
  PENDING = 'PENDING',
  SIGNED_UP = 'SIGNED_UP',
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  LOAN_APPROVED = 'LOAN_APPROVED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  REWARDED = 'REWARDED',
  EXPIRED = 'EXPIRED',
}

@Entity('referrals')
@Index(['referrerId', 'referredEmail'], { unique: true })
@Index(['referralCode'], { unique: true })
@Index(['status', 'createdAt'])
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  referrerId: string; // Customer who made the referral

  // @ManyToOne(() => Customer)
  // @JoinColumn({ name: 'referrerId' })
  // referrer: Customer;

  @Column({ unique: true })
  referralCode: string; // Unique referral code

  @Column()
  referredEmail: string; // Email of referred person

  @Column({ nullable: true })
  referredName: string | null;

  @Column({ type: 'uuid', nullable: true })
  referredCustomerId: string | null; // Customer ID once they sign up

  // Customer entity doesn't exist - using string reference
  // @ManyToOne(() => Customer, { nullable: true })
  // @JoinColumn({ name: 'referredCustomerId' })
  // referredCustomer: Customer | null;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null; // Application ID if referred person applies

  @ManyToOne(() => LoanApplication, { nullable: true })
  @JoinColumn({ name: 'applicationId' })
  application: LoanApplication | null;

  @Column({ type: 'enum', enum: ReferralStatus, default: ReferralStatus.PENDING })
  status: ReferralStatus;

  @Column({ type: 'int', default: 0 })
  referrerPointsReward: number; // Points for referrer

  @Column({ type: 'int', default: 0 })
  referredPointsReward: number; // Points for referred person

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  referrerCashReward: number | null; // Cash reward for referrer

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  referredCashReward: number | null; // Cash reward for referred person

  @Column({ type: 'boolean', default: false })
  referrerRewarded: boolean;

  @Column({ type: 'boolean', default: false })
  referredRewarded: boolean;

  @Column({ type: 'timestamp', nullable: true })
  rewardedAt: Date | null;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date | null; // Referral expiry date

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

