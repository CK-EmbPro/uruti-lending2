import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DocumentationStatus } from '../dto/api-documentation.dto';

@Entity('api_documentation')
@Index(['endpoint', 'method'])
@Index(['status'])
export class APIDocumentation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  endpoint: string;

  @Column()
  method: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DocumentationStatus,
    default: DocumentationStatus.DRAFT,
  })
  status: DocumentationStatus;

  @Column({ type: 'jsonb', nullable: true })
  requestExample: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  responseExample: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  testCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

