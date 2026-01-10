import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReportType {
  ANNUAL_REPORT = 'ANNUAL_REPORT',
  QUARTERLY_REPORT = 'QUARTERLY_REPORT',
  MONTHLY_REPORT = 'MONTHLY_REPORT',
  COMPLIANCE_REPORT = 'COMPLIANCE_REPORT',
  AUDIT_REPORT = 'AUDIT_REPORT',
  RISK_REPORT = 'RISK_REPORT',
  CAPITAL_REPORT = 'CAPITAL_REPORT',
  LIQUIDITY_REPORT = 'LIQUIDITY_REPORT',
  CUSTOM = 'CUSTOM',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  SUBMITTED = 'SUBMITTED',
  FAILED = 'FAILED',
}

export enum Jurisdiction {
  US_FEDERAL = 'US_FEDERAL',
  US_STATE = 'US_STATE',
  EU = 'EU',
  UK = 'UK',
  INDIA = 'INDIA',
  SINGAPORE = 'SINGAPORE',
  AUSTRALIA = 'AUSTRALIA',
  CUSTOM = 'CUSTOM',
}

@Entity('regulatory_reports')
@Index(['companyId'])
@Index(['type'])
@Index(['jurisdiction'])
@Index(['status'])
@Index(['dueDate'])
export class RegulatoryReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  type: ReportType;

  @Column({
    type: 'enum',
    enum: Jurisdiction,
  })
  jurisdiction: Jurisdiction;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
  })
  status: ReportStatus;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  regulatoryAuthority: string;

  @Column({ nullable: true })
  templateId: string;

  @Column({ type: 'json', nullable: true })
  parameters: Record<string, any>;

  @Column({ nullable: true })
  filePath: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number; // Bytes

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'text', nullable: true })
  submissionReference: string; // Reference number from regulatory authority

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  reportData: Record<string, any>; // Generated report data

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

