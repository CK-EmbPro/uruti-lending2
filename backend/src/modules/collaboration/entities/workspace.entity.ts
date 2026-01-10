import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WorkspaceType } from '../dto/collaboration.dto';

@Entity('collaboration_workspaces')
@Index(['workspaceType', 'entityId'])
@Index(['createdBy'])
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceName: string;

  @Column({
    type: 'enum',
    enum: WorkspaceType,
  })
  workspaceType: WorkspaceType;

  @Column()
  entityId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  createdBy: string;

  @Column({ type: 'int', default: 0 })
  memberCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

