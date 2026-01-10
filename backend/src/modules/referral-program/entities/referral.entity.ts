import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

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
@Index(['referrerId'])
@Index(['referralCode'], { unique: true })
@Index(['referredEmail'])
@Index(['status'])
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  referrerId: string; // Customer who made the referral

  @Column({ unique: true })
  referralCode: string; // Unique referral code

  @Column()
  referredEmail: string; // Email of referred person

  @Column({ nullable: true })
  referredPhone: string;

  @Column({ nullable: true })
  referredCustomerId: string; // ID of referred customer (if they signed up)

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  status: ReferralStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  rewardAmount: number; // Reward amount for referrer

  @Column({ type: 'boolean', default: false })
  rewardPaid: boolean; // Whether reward has been paid

  @Column({ type: 'date', nullable: true })
  rewardPaidDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date; // Referral expiry date

  @Column({ type: 'date', nullable: true })
  signedUpDate: Date; // When referred person signed up

  @Column({ nullable: true })
  applicationId: string; // Loan application ID (if referred person applied)

  @Column({ nullable: true })
  loanId: string; // Loan ID (if loan was disbursed)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

