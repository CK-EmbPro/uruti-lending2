import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('rate_limit_logs')
@Index(['ruleId'])
@Index(['identifier'])
@Index(['isBlocked'])
@Index(['timestamp'])
export class RateLimitLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ruleId: string;

  @Column()
  identifier: string; // User ID, IP address, API key, etc.

  @Column()
  endpoint: string;

  @Column({ type: 'boolean' })
  isBlocked: boolean;

  @Column({ type: 'int' })
  currentCount: number;

  @Column({ type: 'int' })
  maxAllowed: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

