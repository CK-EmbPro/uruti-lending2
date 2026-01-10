import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { ThirdPartyPlatform } from './third-party-platform.entity';

export enum WebhookDeliveryStatus {
  PENDING = 'Pending',
  SUCCESS = 'Success',
  FAILED = 'Failed',
  RETRYING = 'Retrying',
}

export enum WebhookEventType {
  LOAN_STATUS_UPDATED = 'loan.status.updated',
  APPLICATION_APPROVED = 'application.approved',
  APPLICATION_REJECTED = 'application.rejected',
  REPAYMENT_POSTED = 'repayment.posted',
  CUSTOMER_CREATED = 'customer.created',
}

@Entity('webhook_deliveries')
@Index(['platformId', 'status'])
@Index(['platformId', 'createdAt'])
@Index(['eventType'])
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  platformId: string;

  @ManyToOne(() => ThirdPartyPlatform, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'platformId' })
  platform: ThirdPartyPlatform;

  @Column({
    type: 'enum',
    enum: WebhookEventType,
  })
  eventType: WebhookEventType;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: WebhookDeliveryStatus,
    default: WebhookDeliveryStatus.PENDING,
  })
  status: WebhookDeliveryStatus;

  @Column({ type: 'int', default: 0 })
  attemptCount: number;

  @Column({ type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ nullable: true })
  webhookUrl: string;

  @Column({ nullable: true })
  responseStatus: number;

  @Column({ type: 'text', nullable: true })
  responseBody: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}

