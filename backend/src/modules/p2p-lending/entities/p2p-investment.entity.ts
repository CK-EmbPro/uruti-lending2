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
import { InvestmentStatus } from '../dto/p2p-lending.dto';
import { P2PListing } from './p2p-listing.entity';

@Entity('p2p_investments')
@Index(['investorId'])
@Index(['listingId'])
@Index(['status'])
@Index(['investmentDate'])
export class P2PInvestment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  investorId: string;

  @Column()
  listingId: string;

  @ManyToOne(() => P2PListing)
  @JoinColumn({ name: 'listingId' })
  listing: P2PListing;

  @Column('decimal', { precision: 15, scale: 2 })
  investmentAmount: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  proposedRate: number; // For auction-type listings

  @Column({
    type: 'enum',
    enum: InvestmentStatus,
    default: InvestmentStatus.PENDING,
  })
  status: InvestmentStatus;

  @Column({ type: 'timestamp' })
  investmentDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  fundedDate: Date;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  principalReceived: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  interestReceived: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalReturns: number;

  @Column('decimal', { precision: 15, scale: 2 })
  outstandingPrincipal: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  roi: number; // Return on investment percentage

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

