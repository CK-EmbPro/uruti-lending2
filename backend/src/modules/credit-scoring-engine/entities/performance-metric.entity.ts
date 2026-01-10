import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('performance_metrics')
@Index(['endpoint', 'timestamp'])
@Index(['companyId', 'timestamp'])
@Index(['success', 'timestamp'])
export class PerformanceMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  endpoint: string; // e.g., 'calculate-weighted-score'

  @Column({ type: 'int' })
  latencyMs: number; // Latency in milliseconds

  @Column({ type: 'boolean' })
  success: boolean; // Whether request was successful

  @Column({ nullable: true })
  companyId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    applicantId?: string;
    applicationId?: string;
    cacheHit?: boolean;
    modelVersion?: string;
    errorMessage?: string;
  };

  @CreateDateColumn()
  timestamp: Date;
}

