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

export enum BadgeType {
  PAYMENT_HERO = 'PAYMENT_HERO', // Perfect payment record
  EARLY_BIRD = 'EARLY_BIRD', // Early payments
  LOAN_MASTER = 'LOAN_MASTER', // Multiple loans
  REFERRAL_CHAMPION = 'REFERRAL_CHAMPION', // Referrals
  LOYAL_CUSTOMER = 'LOYAL_CUSTOMER', // Long-term customer
  REVIEWER = 'REVIEWER', // Left reviews
  SOCIAL_INFLUENCER = 'SOCIAL_INFLUENCER', // Social shares
  MILESTONE = 'MILESTONE', // Various milestones
  SPECIAL = 'SPECIAL', // Special achievements
}

export enum BadgeRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

@Entity('badges')
@Index(['badgeType'], { unique: true })
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  badgeCode: string; // Unique badge identifier

  @Column()
  badgeName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: BadgeType })
  badgeType: BadgeType;

  @Column({ type: 'enum', enum: BadgeRarity, default: BadgeRarity.COMMON })
  rarity: BadgeRarity;

  @Column({ type: 'varchar', length: 500, nullable: true })
  iconUrl: string | null; // Badge icon URL

  @Column({ type: 'varchar', length: 7, nullable: true })
  iconColor: string | null; // Hex color code

  @Column({ type: 'json', nullable: true })
  criteria: Record<string, any>; // Criteria to earn badge

  @Column({ type: 'int', default: 0 })
  pointsReward: number; // Points awarded when badge is earned

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('customer_badges')
@Index(['customerId', 'badgeId'], { unique: true })
@Index(['customerId', 'earnedAt'])
export class CustomerBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  // @ManyToOne(() => Customer)
  // @JoinColumn({ name: 'customerId' })
  // customer: Customer;

  @Column({ type: 'uuid' })
  badgeId: string;

  @ManyToOne(() => Badge)
  @JoinColumn({ name: 'badgeId' })
  badge: Badge;

  @Column({ type: 'date' })
  earnedAt: Date; // Date when badge was earned

  @Column({ type: 'int', default: 0 })
  progress: number; // Progress toward badge (0-100)

  @Column({ type: 'boolean', default: false })
  isDisplayed: boolean; // Show on profile

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

