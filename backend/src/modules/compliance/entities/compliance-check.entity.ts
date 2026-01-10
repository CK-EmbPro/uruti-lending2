import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ComplianceCheckType {
  POLICY_COMPLIANCE = 'POLICY_COMPLIANCE',
  REGULATORY_COMPLIANCE = 'REGULATORY_COMPLIANCE',
  DATA_PRIVACY = 'DATA_PRIVACY',
  KYC_AML = 'KYC_AML',
  FAIR_LENDING = 'FAIR_LENDING',
  DOCUMENT_COMPLIANCE = 'DOCUMENT_COMPLIANCE',
  REPORTING_COMPLIANCE = 'REPORTING_COMPLIANCE',
}

export enum ComplianceCheckStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  WARNING = 'WARNING',
  PENDING = 'PENDING',
}

@Entity('compliance_checks')
@Index(['entityType', 'entityId', 'checkType'])
@Index(['status', 'checkedAt'])
export class ComplianceCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: string; // 'loan', 'application', 'customer', 'document', etc.

  @Column()
  entityId: string;

  @Column({ type: 'enum', enum: ComplianceCheckType })
  checkType: ComplianceCheckType;

  @Column({ type: 'enum', enum: ComplianceCheckStatus })
  status: ComplianceCheckStatus;

  @Column({ type: 'text' })
  checkName: string; // Human-readable check name

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'json', nullable: true })
  checkCriteria: Record<string, any>; // Criteria used for the check

  @Column({ type: 'json', nullable: true })
  findings: Record<string, any>; // Detailed findings

  @Column({ type: 'json', nullable: true })
  violations: Record<string, any>[]; // List of violations found

  @Column({ type: 'text', nullable: true })
  remediation: string | null; // Recommended remediation steps

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  complianceScore: number | null; // 0-100 compliance score

  @Column({ type: 'timestamp' })
  checkedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  checkedBy: string | null; // User ID or 'SYSTEM'

  @Column({ type: 'varchar', length: 255, nullable: true })
  policyId: string | null; // Reference to policy/regulation

  @Column({ type: 'varchar', length: 255, nullable: true })
  regulatoryChangeId: string | null; // Reference to regulatory change

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

