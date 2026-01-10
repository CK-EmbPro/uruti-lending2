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

export enum AuditActionType {
  PLATFORM_CREATED = 'platform.created',
  PLATFORM_UPDATED = 'platform.updated',
  PLATFORM_DELETED = 'platform.deleted',
  API_KEY_REGENERATED = 'api_key.regenerated',
  WEBHOOK_SECRET_REGENERATED = 'webhook_secret.regenerated',
  PERMISSIONS_UPDATED = 'permissions.updated',
  STATUS_CHANGED = 'status.changed',
  WEBHOOK_TESTED = 'webhook.tested',
}

@Entity('integration_audit_logs')
@Index(['platformId', 'createdAt'])
@Index(['actionType'])
@Index(['userId'])
export class IntegrationAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  platformId: string;

  @ManyToOne(() => ThirdPartyPlatform, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'platformId' })
  platform: ThirdPartyPlatform;

  @Column({
    type: 'enum',
    enum: AuditActionType,
  })
  actionType: AuditActionType;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}

