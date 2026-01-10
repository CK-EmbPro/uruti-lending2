import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { OfferStatus } from '../../../common/enums/offer-status.enum';
import { DistributionChannel } from '../../../common/enums/distribution-channel.enum';
import { Campaign } from './campaign.entity';

@Entity('pre_approved_offers')
@Index(['campaignId'])
@Index(['customerId'])
@Index(['status'])
@Index(['offerCode'], { unique: true })
export class PreApprovedOffer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.offers)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  customerId: string; // Customer/User ID

  @Column({ unique: true })
  offerCode: string; // Unique offer code for tracking

  // Offer details
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  approvedAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  interestRate: number;

  @Column({ type: 'int' })
  termMonths: number;

  @Column({ type: 'jsonb', nullable: true })
  additionalTerms: Record<string, any>;

  // Status
  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus;

  // Distribution
  @Column({
    type: 'enum',
    enum: DistributionChannel,
  })
  distributionChannel: DistributionChannel;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  declinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiredAt: Date;

  @Column({ type: 'timestamp' })
  expiryDate: Date;

  // Conversion tracking
  @Column({ type: 'boolean', default: false })
  converted: boolean;

  @Column({ nullable: true })
  convertedLoanApplicationId: string;

  @Column({ type: 'timestamp', nullable: true })
  convertedAt: Date;

  // Tracking
  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'text', nullable: true })
  declineReason: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}














