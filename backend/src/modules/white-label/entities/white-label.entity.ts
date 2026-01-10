import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WhiteLabelStatus, RevenueShareModel } from '../dto/white-label.dto';

@Entity('white_label_configurations')
@Index(['partnerCode'], { unique: true })
@Index(['customDomain'], { unique: true, where: '"customDomain" IS NOT NULL' })
@Index(['subdomain'], { unique: true, where: '"subdomain" IS NOT NULL' })
@Index(['status'])
export class WhiteLabelConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  partnerCode: string;

  @Column()
  partnerName: string;

  @Column({ nullable: true, unique: true })
  customDomain: string;

  @Column({ nullable: true, unique: true })
  subdomain: string;

  // Branding
  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  faviconUrl: string;

  @Column({ nullable: true })
  primaryColor: string;

  @Column({ nullable: true })
  secondaryColor: string;

  @Column({ type: 'text', nullable: true })
  customCss: string;

  // Contact Information
  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  supportUrl: string;

  @Column({ nullable: true })
  termsUrl: string;

  @Column({ nullable: true })
  privacyUrl: string;

  // Revenue Sharing
  @Column({
    type: 'enum',
    enum: RevenueShareModel,
    default: RevenueShareModel.PERCENTAGE,
  })
  revenueShareModel: RevenueShareModel;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  revenueSharePercentage: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  fixedFeePerTransaction: number;

  @Column({ type: 'jsonb', nullable: true })
  revenueShareConfig: Record<string, any>;

  // Features & Configuration
  @Column({ type: 'jsonb', nullable: true })
  allowedFeatures: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Status
  @Column({
    type: 'enum',
    enum: WhiteLabelStatus,
    default: WhiteLabelStatus.ACTIVE,
  })
  status: WhiteLabelStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

