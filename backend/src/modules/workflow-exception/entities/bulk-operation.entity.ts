import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BulkOperationStatus } from '../../../common/enums/bulk-operation-status.enum';
import { BulkOperationType } from '../../../common/enums/bulk-operation-type.enum';

@Entity('bulk_operations')
@Index(['status'])
@Index(['operationType'])
@Index(['createdBy'])
@Index(['executedAt'])
export class BulkOperation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  operationName: string;

  @Column({
    type: 'enum',
    enum: BulkOperationType,
  })
  operationType: BulkOperationType;

  @Column({
    type: 'enum',
    enum: BulkOperationStatus,
    default: BulkOperationStatus.DRAFT,
  })
  status: BulkOperationStatus;

  // Criteria for selection
  @Column({ type: 'jsonb' })
  selectionCriteria: Record<string, any>; // e.g., { loanStatus: 'Active', daysPastDue: { $gte: 30 } }

  @Column({ type: 'int', default: 0 })
  estimatedAffectedCount: number;

  @Column({ type: 'int', default: 0 })
  actualAffectedCount: number;

  // Operation details
  @Column({ type: 'jsonb' })
  operationDetails: Record<string, any>; // The actual changes to apply

  @Column({ type: 'text', nullable: true })
  operationDescription: string;

  // Preview data (before execution)
  @Column({ type: 'jsonb', nullable: true })
  previewData: {
    sampleRecords: any[];
    affectedFields: string[];
    estimatedImpact: string;
  };

  @Column({ type: 'boolean', default: false })
  previewGenerated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  previewGeneratedAt: Date;

  // Approval
  @Column({ nullable: true })
  approvedBy: string; // User ID

  @Column({ nullable: true })
  approvedByName: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalNotes: string;

  // Execution
  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date;

  @Column({ nullable: true })
  executedBy: string; // User ID

  @Column({ type: 'int', nullable: true })
  executionDurationSeconds: number;

  // Results
  @Column({ type: 'jsonb', nullable: true })
  executionResults: {
    totalProcessed: number;
    successful: number;
    failed: number;
    errors: Array<{
      recordId: string;
      error: string;
    }>;
    warnings: string[];
  };

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  // Reporting
  @Column({ type: 'text', nullable: true })
  reportPath: string; // Path to generated confirmation report

  @Column({ type: 'boolean', default: false })
  reportGenerated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reportGeneratedAt: Date;

  // Creator
  @Column()
  createdBy: string; // User ID

  @Column()
  createdByName: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

