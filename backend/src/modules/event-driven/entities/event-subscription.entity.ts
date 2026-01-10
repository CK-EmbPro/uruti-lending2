import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { HandlerType } from '../dto/event-driven.dto';

@Entity('event_subscriptions')
@Index(['eventPattern'])
@Index(['isActive'])
@Index(['handlerType'])
export class EventSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventPattern: string; // Supports wildcards like 'loan.*'

  @Column({
    type: 'enum',
    enum: HandlerType,
  })
  handlerType: HandlerType;

  @Column({ type: 'jsonb' })
  handlerConfig: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  processedCount: number;

  @Column({ type: 'int', default: 0 })
  failedCount: number;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastProcessedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

