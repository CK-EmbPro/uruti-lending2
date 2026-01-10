import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RateLimitStrategy, RateLimitScope } from '../dto/rate-limiting.dto';

@Entity('rate_limit_rules_enhanced')
@Index(['endpointPattern'])
@Index(['isActive'])
@Index(['scope'])
export class RateLimitRuleEnhanced {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  endpointPattern: string; // Supports wildcards like /api/loans/*

  @Column({ type: 'int' })
  maxRequests: number;

  @Column({ type: 'int' })
  timeWindow: number; // in seconds

  @Column({
    type: 'enum',
    enum: RateLimitStrategy,
    default: RateLimitStrategy.FIXED_WINDOW,
  })
  strategy: RateLimitStrategy;

  @Column({
    type: 'enum',
    enum: RateLimitScope,
    default: RateLimitScope.IP,
  })
  scope: RateLimitScope;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  totalRequests: number;

  @Column({ type: 'int', default: 0 })
  blockedRequests: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

