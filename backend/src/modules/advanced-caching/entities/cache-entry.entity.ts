import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CacheStrategy, CacheTier } from '../dto/advanced-caching.dto';

@Entity('cache_entries')
@Index(['cacheKey'])
@Index(['expiresAt'])
@Index(['strategy'])
@Index(['tier'])
export class CacheEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  cacheKey: string;

  @Column({ type: 'jsonb' })
  cacheValue: Record<string, any>;

  @Column({
    type: 'enum',
    enum: CacheStrategy,
    default: CacheStrategy.TTL,
  })
  strategy: CacheStrategy;

  @Column({
    type: 'enum',
    enum: CacheTier,
    default: CacheTier.MEMORY,
  })
  tier: CacheTier;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  accessCount: number;

  @Column({ type: 'timestamp' })
  lastAccessedAt: Date;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;
}
