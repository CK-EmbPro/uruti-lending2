import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { P2PListingStatus, FundingType } from '../dto/p2p-lending.dto';
import { P2PInvestment } from './p2p-investment.entity';

@Entity('p2p_listings')
@Index(['loanApplicationId'])
@Index(['status'])
@Index(['fundingDeadline'])
export class P2PListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanApplicationId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  targetAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  currentAmount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  interestRate: number;

  @Column('decimal', { precision: 15, scale: 2 })
  minimumInvestment: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maximumInvestment: number;

  @Column({
    type: 'enum',
    enum: FundingType,
  })
  fundingType: FundingType;

  @Column({
    type: 'enum',
    enum: P2PListingStatus,
    default: P2PListingStatus.DRAFT,
  })
  status: P2PListingStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  fundingDeadline: Date;

  @Column({ type: 'timestamp', nullable: true })
  fundedAt: Date;

  @Column({ type: 'int', default: 0 })
  investorCount: number;

  @Column({ type: 'jsonb', nullable: true })
  borrowerProfile: Record<string, any>; // Anonymized borrower info

  @Column({ type: 'jsonb', nullable: true })
  riskMetrics: Record<string, any>; // Credit score, risk rating, etc.

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => P2PInvestment, (investment) => investment.listing)
  investments: P2PInvestment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

