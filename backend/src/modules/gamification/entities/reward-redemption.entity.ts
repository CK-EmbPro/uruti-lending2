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

export enum RewardType {
  INTEREST_RATE_DISCOUNT = 'INTEREST_RATE_DISCOUNT',
  FEE_WAIVER = 'FEE_WAIVER',
  CASHBACK = 'CASHBACK',
  GIFT_CARD = 'GIFT_CARD',
  PRODUCT_ACCESS = 'PRODUCT_ACCESS',
  MERCHANDISE = 'MERCHANDISE',
  EXPERIENCE = 'EXPERIENCE',
}

export enum RedemptionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

@Entity('rewards_catalog')
@Index(['rewardCode'], { unique: true })
@Index(['isActive', 'rewardType'])
export class RewardCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  rewardCode: string;

  @Column()
  rewardName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: RewardType })
  rewardType: RewardType;

  @Column({ type: 'int' })
  pointsRequired: number; // Points needed to redeem

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  cashValue: number | null; // Cash value of reward

  @Column({ type: 'int', default: -1 })
  stockQuantity: number; // -1 for unlimited

  @Column({ type: 'int', default: 0 })
  redeemedCount: number; // Number of times redeemed

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'json', nullable: true })
  terms: Record<string, any>; // Terms and conditions

  @Column({ type: 'json', nullable: true })
  eligibility: Record<string, any>; // Eligibility criteria (tier, etc.)

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  validFrom: Date | null;

  @Column({ type: 'date', nullable: true })
  validUntil: Date | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('reward_redemptions')
@Index(['customerId', 'status'])
@Index(['redemptionDate'])
export class RewardRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  // @ManyToOne(() => Customer)
  // @JoinColumn({ name: 'customerId' })
  // customer: Customer;

  @Column({ type: 'uuid' })
  rewardId: string;

  @ManyToOne(() => RewardCatalog)
  @JoinColumn({ name: 'rewardId' })
  reward: RewardCatalog;

  @Column({ type: 'int' })
  pointsUsed: number;

  @Column({ type: 'enum', enum: RedemptionStatus, default: RedemptionStatus.PENDING })
  status: RedemptionStatus;

  @Column({ type: 'date' })
  redemptionDate: Date;

  @Column({ type: 'date', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  processedBy: string | null; // User ID who processed

  @Column({ type: 'text', nullable: true })
  redemptionCode: string | null; // Code/voucher for redemption

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

