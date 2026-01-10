import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MetricType {
  API_RESPONSE_TIME = 'API_RESPONSE_TIME',
  API_ERROR_RATE = 'API_ERROR_RATE',
  DATABASE_QUERY_TIME = 'DATABASE_QUERY_TIME',
  MEMORY_USAGE = 'MEMORY_USAGE',
  CPU_USAGE = 'CPU_USAGE',
  ACTIVE_CONNECTIONS = 'ACTIVE_CONNECTIONS',
  REQUEST_COUNT = 'REQUEST_COUNT',
  CACHE_HIT_RATE = 'CACHE_HIT_RATE',
}

@Entity('performance_metrics')
@Index(['companyId', 'metricType', 'timestamp'])
@Index(['timestamp'])
export class PerformanceMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: MetricType,
  })
  metricType: MetricType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ nullable: true })
  endpoint: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;
}

