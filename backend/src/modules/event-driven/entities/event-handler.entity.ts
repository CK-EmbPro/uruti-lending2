import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EventStatus } from '../dto/event-driven.dto';
import { Event } from './event.entity';
import { EventSubscription } from './event-subscription.entity';

@Entity('event_handlers')
@Index(['eventId'])
@Index(['subscriptionId'])
@Index(['status'])
@Index(['executedAt'])
export class EventHandler {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => EventSubscription)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: EventSubscription;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status: EventStatus;

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date;

  @Column({ type: 'int' })
  executionTime: number; // milliseconds

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;
}

