import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AnalysisType {
  ROLL_RATE = 'ROLL_RATE',
  VINTAGE = 'VINTAGE',
  COHORT = 'COHORT',
}

@Entity('roll_rate_analyses')
@Index(['analysisDate'])
@Index(['analysisType'])
export class RollRateAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AnalysisType,
    default: AnalysisType.ROLL_RATE,
  })
  analysisType: AnalysisType;

  @Column({ type: 'date' })
  analysisDate: Date;

  @Column({ type: 'date', nullable: true })
  periodStartDate: Date;

  @Column({ type: 'date', nullable: true })
  periodEndDate: Date;

  @Column({ nullable: true })
  companyId: string;

  @Column({ nullable: true })
  loanProductId: string;

  // Roll Rate Matrix (JSON)
  // Structure: { fromBucket: { toBucket: count, ... }, ... }
  @Column('jsonb', { nullable: true })
  rollRateMatrix: any;

  // Movement Summary
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  currentTo30Days: number; // Percentage

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  days30To60Days: number; // Percentage

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  days60To90Days: number; // Percentage

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  days90To180Days: number; // Percentage

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  days180To365Days: number; // Percentage

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  days365Plus: number; // Percentage

  // Loss Forecast
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  forecastedLosses: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  lossRate: number; // Percentage

  // Trends (JSON)
  @Column('jsonb', { nullable: true })
  trends: any;

  // Vintage/Cohort Data (JSON)
  @Column('jsonb', { nullable: true })
  vintageData: any;

  @Column('jsonb', { nullable: true })
  cohortData: any;

  @Column('text', { nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

