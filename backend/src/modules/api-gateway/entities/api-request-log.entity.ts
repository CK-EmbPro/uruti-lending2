import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum RequestStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
}

@Entity('api_request_logs')
@Index(['routeId'])
@Index(['userId'])
@Index(['status'])
@Index(['requestDate'])
@Index(['ipAddress'])
export class ApiRequestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  routeId: string;

  @Column()
  routePath: string;

  @Column()
  method: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
  })
  status: RequestStatus;

  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'int' })
  responseTime: number; // milliseconds

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp' })
  requestDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  requestHeaders: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  responseHeaders: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

