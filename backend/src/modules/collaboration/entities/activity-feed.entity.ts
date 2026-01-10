import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ActivityType } from '../dto/collaboration.dto';

@Entity('activity_feeds')
@Index(['userId'])
@Index(['entityType', 'entityId'])
@Index(['activityType'])
@Index(['createdAt'])
export class ActivityFeed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

