import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ListingCategory, ListingPriority } from '../dto/marketplace-enhanced.dto';
import { P2PListingStatus } from '../../p2p-lending/dto/p2p-lending.dto';

@Entity('marketplace_listings')
@Index(['loanApplicationId'])
@Index(['category'])
@Index(['status'])
@Index(['isFeatured'])
@Index(['priority'])
@Index(['createdAt'])
export class MarketplaceListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanApplicationId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ListingCategory,
  })
  category: ListingCategory;

  @Column('decimal', { precision: 15, scale: 2 })
  targetAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  currentAmount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  interestRate: number;

  @Column({
    type: 'enum',
    enum: ListingPriority,
    default: ListingPriority.MEDIUM,
  })
  priority: ListingPriority;

  @Column({
    type: 'enum',
    enum: P2PListingStatus,
    default: P2PListingStatus.OPEN,
  })
  status: P2PListingStatus;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'int', default: 0 })
  investorCount: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  riskMetrics: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

