import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SearchEntityType } from '../../../common/enums/search-entity-type.enum';

@Entity('saved_searches')
@Index(['userId'])
@Index(['entityType'])
export class SavedSearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string; // User-friendly name for the search

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SearchEntityType,
    nullable: true,
  })
  entityType: SearchEntityType | null; // null = search all

  @Column({ type: 'text', nullable: true })
  query: string; // Search query text

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, any>; // Advanced filters (status, date ranges, amounts, etc.)

  @Column({ type: 'jsonb', nullable: true })
  sortBy: Record<string, 'ASC' | 'DESC'>; // Sort configuration

  @Column({ type: 'int', default: 20 })
  limit: number;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean; // Default search for this entity type

  @Column({ type: 'int', default: 0 })
  useCount: number; // Track how often this search is used

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;
}

