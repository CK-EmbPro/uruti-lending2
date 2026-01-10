import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WebhookEvent {
  LOAN_APPLICATION_CREATED = 'LOAN_APPLICATION_CREATED',
  LOAN_APPLICATION_APPROVED = 'LOAN_APPLICATION_APPROVED',
  LOAN_APPLICATION_REJECTED = 'LOAN_APPLICATION_REJECTED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  LOAN_CLOSED = 'LOAN_CLOSED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_MISSED = 'PAYMENT_MISSED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
}

export enum WebhookStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FAILING = 'FAILING',
}

@Entity('webhooks')
@Index(['companyId'])
@Index(['status'])
@Index(['url'])
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  url: string;

  @Column()
  name: string;

  @Column({ type: 'json' })
  events: WebhookEvent[];

  @Column({ nullable: true })
  secret: string; // For HMAC signature

  @Column({
    type: 'enum',
    enum: WebhookStatus,
    default: WebhookStatus.ACTIVE,
  })
  status: WebhookStatus;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  totalDeliveries: number;

  @Column({ type: 'int', default: 0 })
  successfulDeliveries: number;

  @Column({ type: 'int', default: 0 })
  failedDeliveries: number;

  @Column({ type: 'timestamp', nullable: true })
  lastDeliveryAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

