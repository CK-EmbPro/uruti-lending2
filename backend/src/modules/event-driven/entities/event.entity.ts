import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { EventStatus, EventPriority } from '../dto/event-driven.dto';
import { EventHandler } from './event-handler.entity';

@Entity('events')
@Index(['eventName'])
@Index(['status'])
@Index(['priority'])
@Index(['publishedAt'])
@Index(['correlationId'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventName: string;

  @Column({ type: 'jsonb' })
  eventData: Record<string, any>;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status: EventStatus;

  @Column({
    type: 'enum',
    enum: EventPriority,
    default: EventPriority.NORMAL,
  })
  priority: EventPriority;

  @Column({ nullable: true })
  correlationId: string;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'timestamp' })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => EventHandler, (handler) => handler.event)
  handlers: EventHandler[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

