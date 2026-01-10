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

@Entity('report_templates')
@Index(['companyId'])
@Index(['type'])
export class ReportTemplate {
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

  @Column({ type: 'json' })
  configuration: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

