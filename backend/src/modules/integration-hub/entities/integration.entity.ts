import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum IntegrationType {
  PAYMENT_GATEWAY = 'PAYMENT_GATEWAY',
  ACCOUNTING = 'ACCOUNTING',
  CRM = 'CRM',
  DOCUMENT_STORAGE = 'DOCUMENT_STORAGE',
  EMAIL_SERVICE = 'EMAIL_SERVICE',
  SMS_SERVICE = 'SMS_SERVICE',
  CREDIT_BUREAU = 'CREDIT_BUREAU',
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  BANKING = 'BANKING',
  ANALYTICS = 'ANALYTICS',
}

export enum IntegrationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CONFIGURING = 'CONFIGURING',
  ERROR = 'ERROR',
}

@Entity('integrations')
@Index(['companyId'])
@Index(['type'])
@Index(['status'])
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: IntegrationType,
  })
  type: IntegrationType;

  @Column()
  provider: string;

  @Column({ type: 'json' })
  configuration: Record<string, any>; // API keys, endpoints, etc.

  @Column({
    type: 'enum',
    enum: IntegrationStatus,
    default: IntegrationStatus.CONFIGURING,
  })
  status: IntegrationStatus;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @Column({ type: 'int', default: 0 })
  errorCount: number;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

