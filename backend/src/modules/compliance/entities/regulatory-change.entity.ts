import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RegulatoryChangeStatus {
  NEW = 'NEW',
  REVIEWED = 'REVIEWED',
  IMPLEMENTED = 'IMPLEMENTED',
  DEFERRED = 'DEFERRED',
}

export enum RegulatoryChangePriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum RegulatorySource {
  FEDERAL_RESERVE = 'FEDERAL_RESERVE',
  CFPB = 'CFPB',
  OCC = 'OCC',
  FDIC = 'FDIC',
  STATE_REGULATOR = 'STATE_REGULATOR',
  INTERNAL = 'INTERNAL',
  OTHER = 'OTHER',
}

@Entity('regulatory_changes')
@Index(['status', 'priority'])
@Index(['effectiveDate'])
export class RegulatoryChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: RegulatorySource })
  source: RegulatorySource;

  @Column({ type: 'varchar', length: 100, nullable: true })
  regulationNumber: string | null;

  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  complianceDeadline: Date | null;

  @Column({ type: 'enum', enum: RegulatoryChangeStatus, default: RegulatoryChangeStatus.NEW })
  status: RegulatoryChangeStatus;

  @Column({ type: 'enum', enum: RegulatoryChangePriority, default: RegulatoryChangePriority.MEDIUM })
  priority: RegulatoryChangePriority;

  @Column({ type: 'json', nullable: true })
  affectedAreas: string[]; // e.g., ['KYC', 'Lending', 'Reporting']

  @Column({ type: 'json', nullable: true })
  requiredActions: Record<string, any>; // Required compliance actions

  @Column({ type: 'text', nullable: true })
  implementationNotes: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string | null; // User ID

  @Column({ type: 'varchar', length: 500, nullable: true })
  sourceUrl: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

