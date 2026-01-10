import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RateLimitStrategy } from '../dto/api-gateway.dto';

@Entity('rate_limit_rules')
@Index(['routePattern'])
@Index(['isActive'])
export class RateLimitRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  routePattern: string;

  @Column({ type: 'int' })
  maxRequests: number;

  @Column({ type: 'int' })
  timeWindow: number; // seconds

  @Column({
    type: 'enum',
    enum: RateLimitStrategy,
  })
  strategy: RateLimitStrategy;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  hitCount: number;

  @Column({ type: 'int', default: 0 })
  blockedCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

