import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ConcentrationType {
  GEOGRAPHY = 'GEOGRAPHY',
  INDUSTRY = 'INDUSTRY',
  PRODUCT = 'PRODUCT',
  CUSTOMER = 'CUSTOMER',
  SECTOR = 'SECTOR',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('concentration_risks')
@Index(['assessmentDate'])
@Index(['concentrationType'])
@Index(['riskLevel'])
export class ConcentrationRisk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  assessmentDate: Date;

  @Column({
    type: 'enum',
    enum: ConcentrationType,
  })
  concentrationType: ConcentrationType;

  @Column()
  segmentIdentifier: string; // e.g., "California", "Technology", "Product-123"

  @Column()
  segmentName: string;

  // Exposure Metrics
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalExposure: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  portfolioTotal: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  concentrationPercentage: number; // Percentage of total portfolio

  // Limits
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  limitPercentage: number; // Maximum allowed percentage

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  limitAmount: number; // Maximum allowed amount

  // Risk Assessment
  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.LOW,
  })
  riskLevel: RiskLevel;

  @Column({ type: 'boolean', default: false })
  limitExceeded: boolean;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  excessPercentage: number; // Amount over limit

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  excessAmount: number; // Amount over limit

  // Breakdown (JSON)
  @Column('jsonb', { nullable: true })
  loanBreakdown: any; // Array of loans in this segment

  @Column('jsonb', { nullable: true })
  additionalMetrics: any; // Additional risk metrics

  // Action Tracking
  @Column({ type: 'boolean', default: false })
  actionRequired: boolean;

  @Column({ type: 'boolean', default: false })
  actionTaken: boolean;

  @Column({ nullable: true })
  actionTakenBy: string;

  @Column({ type: 'timestamp', nullable: true })
  actionTakenAt: Date;

  @Column('text', { nullable: true })
  correctiveAction: string;

  @Column('text', { nullable: true })
  remarks: string;

  @Column({ nullable: true })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

