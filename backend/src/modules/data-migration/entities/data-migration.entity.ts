import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MigrationType, MigrationStatus } from '../dto/data-migration.dto';

@Entity('data_migrations')
@Index(['status'])
@Index(['migrationType'])
@Index(['createdAt'])
export class DataMigration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  sourceSystem: string;

  @Column()
  targetEntity: string;

  @Column({
    type: 'enum',
    enum: MigrationType,
  })
  migrationType: MigrationType;

  @Column({
    type: 'enum',
    enum: MigrationStatus,
    default: MigrationStatus.PENDING,
  })
  status: MigrationStatus;

  @Column({ type: 'int', default: 0 })
  totalRecords: number;

  @Column({ type: 'int', default: 0 })
  processedRecords: number;

  @Column({ type: 'int', default: 0 })
  successfulRecords: number;

  @Column({ type: 'int', default: 0 })
  failedRecords: number;

  @Column({ type: 'jsonb', nullable: true })
  fieldMapping: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  transformationRules: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  validationRules: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  errors: Array<{ record: number; field: string; error: string }>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  rolledBackAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

