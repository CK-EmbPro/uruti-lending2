import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RuleType {
  CREDIT_DECISION = 'CREDIT_DECISION',
  PRICING = 'PRICING',
  COLLECTIONS = 'COLLECTIONS',
  APPROVAL = 'APPROVAL',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  ELIGIBILITY = 'ELIGIBILITY',
}

export enum RuleStatus {
  DRAFT = 'DRAFT',
  TESTING = 'TESTING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity('visual_rules')
@Index(['companyId'])
@Index(['type'])
@Index(['status'])
@Index(['isActive'])
export class VisualRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: RuleType,
  })
  type: RuleType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json' })
  nodes: Array<{
    id: string;
    nodeType: string;
    condition?: {
      field: string;
      operator: string;
      value: any;
      secondValue?: any;
    };
    action?: {
      type: string;
      parameters: Record<string, any>;
    };
    logicalOperator?: string;
    children?: string[];
  }>;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'enum', enum: RuleStatus, default: RuleStatus.DRAFT })
  status: RuleStatus;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  executionCount: number;

  @Column({ type: 'int', default: 0 })
  successCount: number;

  @Column({ type: 'json', nullable: true })
  testResults: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  impactAnalysis: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastTestedAt: Date;

  @Column({ nullable: true })
  lastTestedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  activatedAt: Date;

  @Column({ nullable: true })
  activatedBy: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

