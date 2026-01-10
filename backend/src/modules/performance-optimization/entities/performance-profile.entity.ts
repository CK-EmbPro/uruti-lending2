import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PerformanceMetricType } from '../dto/performance-optimization.dto';

@Entity('performance_profiles')
@Index(['endpoint', 'method'])
@Index(['createdAt'])
export class PerformanceProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  endpoint: string;

  @Column()
  method: string;

  @Column({ type: 'int' })
  avgResponseTime: number; // milliseconds

  @Column({ type: 'int' })
  minResponseTime: number;

  @Column({ type: 'int' })
  maxResponseTime: number;

  @Column({ type: 'int' })
  p95ResponseTime: number;

  @Column({ type: 'int' })
  p99ResponseTime: number;

  @Column({ type: 'int' })
  requestCount: number;

  @Column({ type: 'int' })
  errorCount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  errorRate: number;

  @Column({ type: 'jsonb', nullable: true })
  metrics: Record<PerformanceMetricType, number>;

  @Column({ type: 'jsonb', nullable: true })
  slowQueries: Array<{
    query: string;
    duration: number;
    count: number;
  }>;

  @Column({ type: 'timestamp' })
  profileStartTime: Date;

  @Column({ type: 'timestamp' })
  profileEndTime: Date;

  @CreateDateColumn()
  createdAt: Date;
}

