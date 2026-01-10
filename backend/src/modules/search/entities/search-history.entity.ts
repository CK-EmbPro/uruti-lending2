import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SearchEntityType } from '../../../common/enums/search-entity-type.enum';

@Entity('search_history')
@Index(['userId'])
@Index(['createdAt'])
@Index(['entityType'])
export class SearchHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: SearchEntityType,
    nullable: true,
  })
  entityType: SearchEntityType | null;

  @Column({ type: 'text', nullable: true })
  query: string;

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  resultCount: number; // Number of results returned

  @Column({ type: 'boolean', default: false })
  clickedResult: boolean; // Whether user clicked on a result

  @CreateDateColumn()
  createdAt: Date;
}

