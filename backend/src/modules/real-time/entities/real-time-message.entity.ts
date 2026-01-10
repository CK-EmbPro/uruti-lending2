import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { MessageType } from '../dto/real-time.dto';

@Entity('real_time_messages')
@Index(['recipientId'])
@Index(['messageType'])
@Index(['sentAt'])
@Index(['isRead'])
export class RealTimeMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recipientId: string;

  @Column({
    type: 'enum',
    enum: MessageType,
  })
  messageType: MessageType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  isUrgent: boolean;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'timestamp' })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

