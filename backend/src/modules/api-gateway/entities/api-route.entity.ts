import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RequestMethod } from '../dto/api-gateway.dto';

@Entity('api_routes')
@Index(['routePath'], { unique: true })
@Index(['targetService'])
@Index(['isActive'])
export class ApiRoute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  routePath: string;

  @Column()
  targetService: string;

  @Column()
  targetUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  methods: RequestMethod[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  requestCount: number;

  @Column({ type: 'int', default: 0 })
  errorCount: number;

  @Column({ type: 'int', default: 0 })
  successCount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  averageResponseTime: number; // milliseconds

  @Column({ type: 'jsonb', nullable: true })
  rateLimitConfig: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  cacheConfig: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

