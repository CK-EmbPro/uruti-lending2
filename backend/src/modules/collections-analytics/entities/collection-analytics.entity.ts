import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CollectionStrategy {
  EARLY_STAGE = 'EARLY_STAGE',
  MODERATE_STAGE = 'MODERATE_STAGE',
  SERIOUS_STAGE = 'SERIOUS_STAGE',
  SEVERE_STAGE = 'SEVERE_STAGE',
  LEGAL = 'LEGAL',
}

export enum ContactChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PHONE = 'PHONE',
  LETTER = 'LETTER',
  IN_PERSON = 'IN_PERSON',
}

@Entity('collection_analytics')
@Index(['companyId', 'loanId'])
@Index(['customerId'])
@Index(['calculatedAt'])
export class CollectionAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  loanId: string;

  @Column()
  customerId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  paymentProbability: number; // 0-1

  @Column({ nullable: true })
  optimalContactTime: string; // e.g., '14:00-16:00'

  @Column({
    type: 'enum',
    enum: ContactChannel,
    nullable: true,
  })
  optimalChannel: ContactChannel;

  @Column({
    type: 'enum',
    enum: CollectionStrategy,
  })
  recommendedStrategy: CollectionStrategy;

  @Column({ type: 'json', default: [] })
  riskFactors: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  confidenceLevel: number; // 0-1

  @Column({ type: 'json', nullable: true })
  historicalData: Record<string, any>;

  @CreateDateColumn()
  calculatedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

