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
import { Loan } from '../../loan/entities/loan.entity';

export enum PointsTransactionType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  ADJUSTED = 'ADJUSTED',
  BONUS = 'BONUS',
}

export enum PointsSource {
  ON_TIME_PAYMENT = 'ON_TIME_PAYMENT',
  EARLY_PAYMENT = 'EARLY_PAYMENT',
  LOAN_APPLICATION = 'LOAN_APPLICATION',
  LOAN_APPROVAL = 'LOAN_APPROVAL',
  REFERRAL = 'REFERRAL',
  REVIEW = 'REVIEW',
  SOCIAL_SHARE = 'SOCIAL_SHARE',
  ANNIVERSARY = 'ANNIVERSARY',
  BIRTHDAY = 'BIRTHDAY',
  ACHIEVEMENT = 'ACHIEVEMENT',
  MANUAL = 'MANUAL',
}

@Entity('loyalty_points')
@Index(['customerId', 'transactionType'])
@Index(['pointsDate', 'expiryDate'])
export class LoyaltyPoints {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  // @ManyToOne(() => Customer)
  // @JoinColumn({ name: 'customerId' })
  // customer: Customer;

  @Column({ type: 'uuid', nullable: true })
  loanId: string | null;

  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loanId' })
  loan: Loan | null;

  @Column({ type: 'int' })
  points: number; // Positive for earned, negative for redeemed

  @Column({ type: 'enum', enum: PointsTransactionType })
  transactionType: PointsTransactionType;

  @Column({ type: 'enum', enum: PointsSource })
  source: PointsSource;

  @Column({ type: 'date' })
  pointsDate: Date; // Date when points were earned/redeemed

  @Column({ type: 'date', nullable: true })
  expiryDate: Date | null; // Points expiry date (if applicable)

  @Column({ type: 'boolean', default: false })
  isExpired: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  reference: string | null; // Reference to source transaction

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('customer_loyalty_summary')
@Index(['customerId'], { unique: true })
export class CustomerLoyaltySummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  customerId: string;

  // Customer relationship - using string ID for now
  // @ManyToOne(() => Customer)
  // @JoinColumn({ name: 'customerId' })
  // customer: Customer;

  @Column({ type: 'int', default: 0 })
  totalPointsEarned: number; // Lifetime points earned

  @Column({ type: 'int', default: 0 })
  totalPointsRedeemed: number; // Lifetime points redeemed

  @Column({ type: 'int', default: 0 })
  currentPointsBalance: number; // Current available points

  @Column({ type: 'int', default: 0 })
  pointsExpiringSoon: number; // Points expiring in next 30 days

  @Column({ type: 'int', default: 0 })
  pointsExpired: number; // Total expired points

  @Column({ type: 'varchar', length: 50, default: 'BRONZE' })
  membershipTier: string; // BRONZE, SILVER, GOLD, PLATINUM

  @Column({ type: 'int', default: 0 })
  tierPoints: number; // Points toward next tier

  @Column({ type: 'int', default: 0 })
  onTimePayments: number; // Count of on-time payments

  @Column({ type: 'int', default: 0 })
  earlyPayments: number; // Count of early payments

  @Column({ type: 'int', default: 0 })
  referralsCount: number; // Number of successful referrals

  @Column({ type: 'date', nullable: true })
  lastPointsEarnedDate: Date | null;

  @Column({ type: 'date', nullable: true })
  membershipSince: Date | null; // Date when customer joined loyalty program

  @Column({ type: 'date', nullable: true })
  tierUpgradeDate: Date | null; // Last tier upgrade date

  @UpdateDateColumn()
  updatedAt: Date;
}

