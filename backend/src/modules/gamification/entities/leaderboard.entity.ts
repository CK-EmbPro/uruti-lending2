import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
// Customer entity - using string reference for migration compatibility
// import { Customer } from '../../customer/entities/customer.entity';

export enum LeaderboardType {
  POINTS = 'POINTS',
  PAYMENTS = 'PAYMENTS',
  REFERRALS = 'REFERRALS',
  TIER = 'TIER',
  OVERALL = 'OVERALL',
}

export enum LeaderboardPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  ALL_TIME = 'ALL_TIME',
}

@Entity('leaderboards')
@Index(['leaderboardType', 'period', 'periodStart'], { unique: true })
export class Leaderboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LeaderboardType })
  leaderboardType: LeaderboardType;

  @Column({ type: 'enum', enum: LeaderboardPeriod })
  period: LeaderboardPeriod;

  @Column({ type: 'date' })
  periodStart: Date; // Start of leaderboard period

  @Column({ type: 'date', nullable: true })
  periodEnd: Date | null; // End of leaderboard period

  @Column({ type: 'int', default: 0 })
  totalParticipants: number;

  @Column({ type: 'json', nullable: true })
  topRankings: Record<string, any>[]; // Top 10-100 rankings

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('leaderboard_entries')
@Index(['leaderboardId', 'customerId'], { unique: true })
@Index(['leaderboardId', 'rank'])
export class LeaderboardEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  leaderboardId: string;

  @ManyToOne(() => Leaderboard)
  @JoinColumn({ name: 'leaderboardId' })
  leaderboard: Leaderboard;

  @Column({ type: 'uuid' })
  customerId: string;

  // @ManyToOne(() => Customer)
  // @JoinColumn({ name: 'customerId' })
  // customer: Customer;

  @Column({ type: 'int' })
  rank: number; // Ranking position

  @Column({ type: 'int' })
  score: number; // Score/points for this leaderboard

  @Column({ type: 'int', nullable: true })
  previousRank: number | null; // Previous ranking

  @Column({ type: 'int', nullable: true })
  rankChange: number | null; // Change in rank (positive = moved up, negative = moved down)

  @Column({ type: 'json', nullable: true })
  metrics: Record<string, any>; // Additional metrics for ranking

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

