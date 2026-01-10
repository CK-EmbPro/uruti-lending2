import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CampaignStatus } from '../../../common/enums/campaign-status.enum';
import { CampaignType } from '../../../common/enums/campaign-type.enum';
import { DistributionChannel } from '../../../common/enums/distribution-channel.enum';
import { PreApprovedOffer } from './pre-approved-offer.entity';

@Entity('campaigns')
@Index(['status'])
@Index(['campaignType'])
@Index(['startDate', 'endDate'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaignName: string;

  @Column({
    type: 'enum',
    enum: CampaignType,
  })
  campaignType: CampaignType;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  // Target criteria (JSON for flexibility)
  @Column({ type: 'jsonb' })
  targetCriteria: Record<string, any>; // e.g., { creditScore: { $gte: 650 }, loanStatus: 'Active' }

  @Column({ type: 'int', default: 0 })
  estimatedEligibleCount: number;

  @Column({ type: 'int', default: 0 })
  actualEligibleCount: number;

  // Distribution
  @Column({
    type: 'enum',
    enum: DistributionChannel,
    default: DistributionChannel.EMAIL,
  })
  distributionChannel: DistributionChannel;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  // Offer details
  @Column({ type: 'jsonb' })
  offerDetails: Record<string, any>; // e.g., { interestRate: 5.5, maxAmount: 50000, term: 36 }

  @Column({ type: 'text', nullable: true })
  offerMessage: string;

  // Tracking
  @Column({ type: 'int', default: 0 })
  offersSent: number;

  @Column({ type: 'int', default: 0 })
  offersViewed: number;

  @Column({ type: 'int', default: 0 })
  offersAccepted: number;

  @Column({ type: 'int', default: 0 })
  offersConverted: number;

  // ROI metrics
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCampaignCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  roi: number; // ROI percentage

  // Creator
  @Column()
  createdBy: string; // User ID

  @Column()
  createdByName: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @OneToMany(() => PreApprovedOffer, (offer) => offer.campaign)
  offers: PreApprovedOffer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}














