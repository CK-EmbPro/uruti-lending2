import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('uptime_logs')
@Index(['timestamp'])
@Index(['status'])
@Index(['timestamp', 'status'])
export class UptimeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, default: 'healthy' })
  status: 'healthy' | 'degraded' | 'down';

  @Column({ type: 'jsonb', nullable: true })
  details?: {
    database?: string;
    responseTime?: number;
    error?: string;
    components?: Record<string, any>;
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}

