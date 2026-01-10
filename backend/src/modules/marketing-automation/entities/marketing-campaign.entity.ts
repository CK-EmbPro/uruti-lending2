import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CampaignType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  MULTI_CHANNEL = 'MULTI_CHANNEL',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TriggerEvent {
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  APPLICATION_APPROVED = 'APPLICATION_APPROVED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  PAYMENT_MISSED = 'PAYMENT_MISSED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  LOAN_CLOSED = 'LOAN_CLOSED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  CUSTOM = 'CUSTOM',
}

@Entity('marketing_campaigns')
@Index(['companyId'])
@Index(['status'])
@Index(['campaignType'])
@Index(['triggerEvent'])
@Index(['scheduledDate'])
export class MarketingCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  campaignName: string;

  @Column({
    type: 'enum',
    enum: CampaignType,
  })
  campaignType: CampaignType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({
    type: 'enum',
    enum: TriggerEvent,
    nullable: true,
  })
  triggerEvent: TriggerEvent | null;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'json', nullable: true })
  segmentCriteria: Array<{
    field: string;
    operator: string;
    value: any;
  }>;

  @Column({ type: 'json', nullable: true })
  customerIds: string[]; // For manual campaigns

  @Column({ type: 'boolean', default: false })
  isABTest: boolean;

  @Column({ type: 'json', nullable: true })
  abTestVariants: Array<{
    variant: string;
    subject?: string;
    content: string;
    percentage: number;
  }>;

  @Column({ type: 'int', default: 0 })
  totalRecipients: number;

  @Column({ type: 'int', default: 0 })
  sentCount: number;

  @Column({ type: 'int', default: 0 })
  deliveredCount: number;

  @Column({ type: 'int', default: 0 })
  openedCount: number;

  @Column({ type: 'int', default: 0 })
  clickedCount: number;

  @Column({ type: 'int', default: 0 })
  conversionCount: number;

  @Column({ type: 'int', default: 0 })
  bouncedCount: number;

  @Column({ type: 'int', default: 0 })
  unsubscribedCount: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

