import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PolicyStatus {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
  SUPERSEDED = 'SUPERSEDED',
}

export enum PolicyCategory {
  LENDING = 'LENDING',
  KYC_AML = 'KYC_AML',
  DATA_PRIVACY = 'DATA_PRIVACY',
  FAIR_LENDING = 'FAIR_LENDING',
  REPORTING = 'REPORTING',
  DOCUMENT_MANAGEMENT = 'DOCUMENT_MANAGEMENT',
  RISK_MANAGEMENT = 'RISK_MANAGEMENT',
  OTHER = 'OTHER',
}

@Entity('compliance_policies')
@Index(['status', 'category'])
@Index(['effectiveDate'])
export class CompliancePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  policyName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  policyNumber: string | null;

  @Column({ type: 'enum', enum: PolicyCategory })
  category: PolicyCategory;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  policyText: string | null; // Full policy text

  @Column({ type: 'enum', enum: PolicyStatus, default: PolicyStatus.ACTIVE })
  status: PolicyStatus;

  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  regulatoryChangeId: string | null; // Linked to regulatory change

  @Column({ type: 'json', nullable: true })
  complianceRequirements: Record<string, any>; // Requirements checklist

  @Column({ type: 'json', nullable: true })
  applicableEntities: string[]; // Entity types this policy applies to

  @Column({ type: 'varchar', length: 255, nullable: true })
  owner: string | null; // User ID responsible for policy

  @Column({ type: 'varchar', length: 255, nullable: true })
  approvedBy: string | null; // User ID who approved

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true })
  supersededBy: string | null; // ID of policy that supersedes this

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

