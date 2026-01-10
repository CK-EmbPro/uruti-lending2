import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity('user_activity_logs')
@Index(['userId'])
@Index(['activityDate'])
@Index(['activityType'])
export class UserActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserAccount)
  user: UserAccount;

  @Column()
  userId: string;

  @Column()
  activityType: string; // e.g., 'LOGIN', 'LOGOUT', 'CREATE_LOAN', 'UPDATE_USER', etc.

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional activity data

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  activityDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}

