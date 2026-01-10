import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';

@Entity('notification_preferences')
@Index(['userId'])
@Index(['entityType', 'entityId'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // User ID (can be customer, employee, etc.)

  @Column({ nullable: true })
  entityType: string; // 'Customer', 'Employee', 'User', etc.

  @Column({ nullable: true })
  entityId: string; // Entity ID if applicable

  @Column({
    type: 'enum',
    enum: NotificationType,
    nullable: true,
  })
  notificationType: NotificationType | null; // null = global preference

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({ type: 'boolean', default: true })
  enabled: boolean; // Whether this channel is enabled

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>; // Channel-specific settings
  // e.g., { quietHours: { start: '22:00', end: '08:00' }, timezone: 'UTC' }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

