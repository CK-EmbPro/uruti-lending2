import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

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

export enum ImpactLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('regulatory_changes')
@Index(['companyId'])
@Index(['jurisdiction'])
@Index(['effectiveDate'])
@Index(['impactLevel'])
export class RegulatoryChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: Jurisdiction,
  })
  jurisdiction: Jurisdiction;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({
    type: 'enum',
    enum: ImpactLevel,
    default: ImpactLevel.MEDIUM,
  })
  impactLevel: ImpactLevel;

  @Column({ type: 'json', default: [] })
  affectedReports: string[]; // Report types affected

  @Column({ type: 'text', nullable: true })
  sourceUrl: string;

  @Column({ type: 'text', nullable: true })
  actionRequired: string; // What action is required

  @Column({ type: 'boolean', default: false })
  acknowledged: boolean;

  @Column({ nullable: true })
  acknowledgedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

