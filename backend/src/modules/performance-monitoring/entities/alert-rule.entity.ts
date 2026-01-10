import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('alert_rules')
@Index(['companyId'])
@Index(['isActive'])
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: MetricType,
  })
  metricType: MetricType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  threshold: number;

  @Column()
  operator: string; // '>', '<', '>=', '<=', '=='

  @Column({
    type: 'enum',
    enum: AlertSeverity,
  })
  severity: AlertSeverity;

  @Column({ nullable: true })
  endpoint: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  triggerCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

