import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ServiceType, ServiceStatus } from '../dto/microservices-communication.dto';

@Entity('service_registry')
@Index(['serviceName'])
@Index(['status'])
@Index(['serviceType'])
export class ServiceRegistry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  serviceName: string;

  @Column()
  serviceUrl: string;

  @Column({
    type: 'enum',
    enum: ServiceType,
  })
  serviceType: ServiceType;

  @Column({ nullable: true })
  healthCheckEndpoint: string;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.UNKNOWN,
  })
  status: ServiceStatus;

  @Column({ type: 'int', default: 0 })
  responseTime: number; // milliseconds

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt: Date;

  @Column({ type: 'int', default: 0 })
  successCount: number;

  @Column({ type: 'int', default: 0 })
  failureCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

