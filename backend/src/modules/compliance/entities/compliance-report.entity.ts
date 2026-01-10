import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReportType {
  REGULATORY = 'REGULATORY',
  INTERNAL = 'INTERNAL',
  AUDIT = 'AUDIT',
  COMPLIANCE_REVIEW = 'COMPLIANCE_REVIEW',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  SUBMITTED = 'SUBMITTED',
  REJECTED = 'REJECTED',
}

export enum ReportFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
  ON_DEMAND = 'ON_DEMAND',
}

@Entity('compliance_reports')
@Index(['reportType', 'status'])
@Index(['reportPeriod', 'generatedAt'])
export class ComplianceReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reportName: string;

  @Column({ type: 'enum', enum: ReportType })
  reportType: ReportType;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.DRAFT })
  status: ReportStatus;

  @Column({ type: 'enum', enum: ReportFrequency, nullable: true })
  frequency: ReportFrequency | null;

  @Column({ type: 'date' })
  reportPeriod: Date; // Start date of reporting period

  @Column({ type: 'date', nullable: true })
  reportPeriodEnd: Date | null; // End date of reporting period

  @Column({ type: 'json', nullable: true })
  reportData: Record<string, any>; // Generated report data

  @Column({ type: 'varchar', length: 500, nullable: true })
  reportFilePath: string | null; // Path to generated report file (PDF, Excel, etc.)

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'json', nullable: true })
  findings: Record<string, any>[]; // Key findings from the report

  @Column({ type: 'json', nullable: true })
  violations: Record<string, any>[]; // Compliance violations found

  @Column({ type: 'json', nullable: true })
  recommendations: Record<string, any>[]; // Recommendations for improvement

  @Column({ type: 'varchar', length: 255, nullable: true })
  generatedBy: string | null; // User ID or 'SYSTEM'

  @Column({ type: 'timestamp', nullable: true })
  generatedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  submittedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  submissionReference: string | null; // Reference number from regulator

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

