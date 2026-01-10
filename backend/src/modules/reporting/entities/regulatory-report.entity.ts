import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RegulatoryReportType {
  HMDA = 'HMDA',
  CRA = 'CRA',
  CALL_REPORT = 'CALL_REPORT',
  STRESS_TEST = 'STRESS_TEST',
}

export enum RegulatoryReportStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  REVIEWED = 'REVIEWED',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
}

@Entity('regulatory_reports')
@Index(['reportType'])
@Index(['reportDate'])
@Index(['status'])
export class RegulatoryReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RegulatoryReportType,
  })
  reportType: RegulatoryReportType;

  @Column({ type: 'date' })
  reportDate: Date;

  @Column({ type: 'date', nullable: true })
  periodStartDate: Date;

  @Column({ type: 'date', nullable: true })
  periodEndDate: Date;

  @Column({
    type: 'enum',
    enum: RegulatoryReportStatus,
    default: RegulatoryReportStatus.DRAFT,
  })
  status: RegulatoryReportStatus;

  @Column({ nullable: true })
  companyId: string;

  // Report Data (JSON)
  @Column('jsonb', { nullable: true })
  reportData: any;

  // Validation
  @Column({ type: 'boolean', default: false })
  isValid: boolean;

  @Column('text', { nullable: true })
  validationErrors: string;

  // Review & Submission
  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  submittedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ nullable: true })
  regulatorName: string;

  @Column({ nullable: true })
  submissionReference: string;

  @Column('text', { nullable: true })
  remarks: string;

  // File Storage
  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  fileName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

