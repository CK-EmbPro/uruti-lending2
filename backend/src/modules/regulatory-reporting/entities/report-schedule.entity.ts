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

@Entity('report_schedules')
@Index(['companyId'])
@Index(['isActive'])
export class ReportSchedule {
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

  @Column()
  cronExpression: string;

  @Column({ type: 'int', default: 7 })
  daysBeforeDue: number; // Generate report N days before due date

  @Column({ type: 'boolean', default: false })
  autoSubmit: boolean; // Automatically submit when generated

  @Column({ type: 'json', default: [] })
  notificationEmails: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastRun: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextRun: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

