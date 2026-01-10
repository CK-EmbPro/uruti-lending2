import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('service_call_logs')
@Index(['serviceName'])
@Index(['status'])
@Index(['timestamp'])
export class ServiceCallLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  serviceName: string;

  @Column()
  endpoint: string;

  @Column()
  method: string;

  @Column({ default: 'success' })
  status: string; // success, error, timeout

  @Column({ type: 'int' })
  responseTime: number; // milliseconds

  @Column({ type: 'int', nullable: true })
  statusCode: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  requestData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  responseData: Record<string, any>;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}

