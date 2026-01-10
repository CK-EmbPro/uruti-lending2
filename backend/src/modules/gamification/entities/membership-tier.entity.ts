import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MembershipTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

@Entity('membership_tiers')
@Index(['tierName'], { unique: true })
export class MembershipTierConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tierName: string; // BRONZE, SILVER, GOLD, PLATINUM

  @Column({ type: 'int' })
  minPoints: number; // Minimum points required for this tier

  @Column({ type: 'int', nullable: true })
  maxPoints: number | null; // Maximum points for this tier (null for highest tier)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  interestRateDiscount: number; // Interest rate discount percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  feeWaiverPercentage: number; // Fee waiver percentage

  @Column({ type: 'json', nullable: true })
  benefits: Record<string, any>; // Tier benefits (e.g., priority support, exclusive products)

  @Column({ type: 'varchar', length: 500, nullable: true })
  iconUrl: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  tierColor: string | null; // Hex color code

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

