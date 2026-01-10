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
import { Campaign } from './campaign.entity';
import { PreApprovedOffer } from './pre-approved-offer.entity';

@Entity('campaign_responses')
@Index(['campaignId'])
@Index(['offerId'])
@Index(['customerId'])
@Index(['responseDate'])
export class CampaignResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ nullable: true })
  offerId: string;

  @ManyToOne(() => PreApprovedOffer, { nullable: true })
  @JoinColumn({ name: 'offerId' })
  offer: PreApprovedOffer;

  @Column()
  customerId: string;

  @Column()
  responseType: string; // 'viewed', 'clicked', 'accepted', 'declined', 'converted'

  @Column({ type: 'timestamp' })
  responseDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  responseData: Record<string, any>; // Additional response metadata

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}














