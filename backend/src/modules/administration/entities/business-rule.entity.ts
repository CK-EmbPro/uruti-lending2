import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RuleStatus } from '../../../common/enums/rule-status.enum';

@Entity('business_rules')
@Index(['ruleName'], { unique: true })
@Index(['status'])
@Index(['ruleCategory'])
export class BusinessRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ruleName: string;

  @Column()
  ruleCategory: string; // e.g., 'Credit Decisioning', 'Pricing', 'Collections', etc.

  @Column({ type: 'text' })
  ruleDescription: string;

  @Column({
    type: 'enum',
    enum: RuleStatus,
    default: RuleStatus.DRAFT,
  })
  status: RuleStatus;

  // Rule Definition (JSON format for flexibility)
  @Column({ type: 'jsonb' })
  ruleDefinition: Record<string, any>; // Rule logic, conditions, actions

  @Column({ type: 'jsonb', nullable: true })
  testData: Record<string, any>; // Test scenarios

  @Column({ type: 'jsonb', nullable: true })
  testResults: Record<string, any>; // Test execution results

  // Sandbox Testing
  @Column({ type: 'boolean', default: false })
  testedInSandbox: boolean;

  @Column({ type: 'timestamp', nullable: true })
  testedAt: Date;

  @Column({ nullable: true })
  testedBy: string;

  @Column({ type: 'text', nullable: true })
  sandboxTestResults: string;

  // Impact Analysis
  @Column({ type: 'jsonb', nullable: true })
  impactAnalysis: Record<string, any>; // Expected impact on portfolio

  @Column({ type: 'int', nullable: true })
  estimatedAffectedLoans: number;

  @Column({ type: 'text', nullable: true })
  impactNotes: string;

  // Production Promotion
  @Column({ type: 'timestamp', nullable: true })
  promotedToProductionAt: Date;

  @Column({ nullable: true })
  promotedBy: string;

  @Column({ type: 'text', nullable: true })
  promotionNotes: string;

  // Monitoring
  @Column({ type: 'jsonb', nullable: true })
  monitoringMetrics: Record<string, any>; // Metrics to track rule performance

  @Column({ type: 'jsonb', nullable: true })
  actualResults: Record<string, any>; // Actual results after promotion

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  previousVersionId: string; // Link to previous version for rollback

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

