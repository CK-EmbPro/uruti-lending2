import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReportType {
  LOAN_PORTFOLIO = 'LOAN_PORTFOLIO',
  CUSTOMER_ANALYTICS = 'CUSTOMER_ANALYTICS',
  FINANCIAL_SUMMARY = 'FINANCIAL_SUMMARY',
  COLLECTION_REPORT = 'COLLECTION_REPORT',
  RISK_ANALYSIS = 'RISK_ANALYSIS',
  OPERATIONAL_METRICS = 'OPERATIONAL_METRICS',
  COMPLIANCE_REPORT = 'COMPLIANCE_REPORT',
  CUSTOM = 'CUSTOM',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON',
  HTML = 'HTML',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('reports')
@Index(['companyId'])
@Index(['type'])
@Index(['status'])
@Index(['createdAt'])
export class Report {
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
    enum: ReportFormat,
    default: ReportFormat.PDF,
  })
  format: ReportFormat;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({ nullable: true })
  filePath: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number; // Bytes

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'json', nullable: true })
  filters: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  customQuery: string;

  @Column({ type: 'boolean', default: true })
  includeCharts: boolean;

  @Column({ type: 'boolean', default: true })
  includeTables: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  previewData: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

