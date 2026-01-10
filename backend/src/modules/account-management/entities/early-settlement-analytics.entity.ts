import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum CustomerSegment {
  MICRO = 'MICRO',
  SME = 'SME',
  ENTERPRISE = 'ENTERPRISE',
}

@Entity('early_settlement_analytics')
@Index(['companyId', 'segment', 'periodStart'])
@Index(['companyId'])
export class EarlySettlementAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: CustomerSegment,
  })
  segment: CustomerSegment;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column('int')
  totalLoans: number; // Total active loans in segment

  @Column('int')
  earlySettlements: number; // Number of early settlements

  @Column('decimal', { precision: 5, scale: 2 })
  settlementRate: number; // Percentage of loans settled early

  @Column('decimal', { precision: 15, scale: 2 })
  totalRebateAmount: number; // Total rebates given

  @Column('decimal', { precision: 15, scale: 2 })
  averageRebateAmount: number; // Average rebate per settlement

  @Column('decimal', { precision: 15, scale: 2 })
  averageSavings: number; // Average savings per settlement

  @Column('int')
  averageMonthsRemaining: number; // Average months remaining when settled

  @CreateDateColumn()
  createdAt: Date;
}

