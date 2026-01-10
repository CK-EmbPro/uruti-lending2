import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { ThirdPartyPlacementStatus } from '../../../common/enums/third-party-placement-status.enum';
import { CollectionAgency } from './collection-agency.entity';

@Entity('third_party_placements')
@Index(['loanId'])
@Index(['placementDate'])
@Index(['status'])
export class ThirdPartyPlacement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => CollectionAgency, (agency) => agency.placements)
  agency: CollectionAgency;

  @Column()
  agencyId: string;

  @Column({
    type: 'enum',
    enum: ThirdPartyPlacementStatus,
    default: ThirdPartyPlacementStatus.PENDING,
  })
  status: ThirdPartyPlacementStatus;

  @Column({ type: 'date' })
  placementDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  placementAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  collectedAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  agencyFee: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  netRecovery: number; // Collected - Agency Fee

  @Column({ type: 'int' })
  daysPastDue: number;

  @Column({ nullable: true })
  placementReason: string;

  @Column({ type: 'date', nullable: true })
  recallDate: Date;

  @Column({ nullable: true })
  recallReason: string;

  @Column({ nullable: true })
  recalledBy: string;

  @Column({ nullable: true })
  recalledById: string;

  @Column({ type: 'date', nullable: true })
  chargeOffDate: Date;

  @Column({ type: 'boolean', default: false })
  chargedOff: boolean;

  @Column({ type: 'date', nullable: true })
  settledDate: Date;

  @Column({ type: 'boolean', default: false })
  settled: boolean;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  settlementAmount: number;

  @Column({ nullable: true })
  accountNumber: string; // Agency's account number for this placement

  @Column({ type: 'text', nullable: true })
  transmittedData: string; // JSON data sent to agency

  @Column({ nullable: true })
  placedBy: string;

  @Column({ nullable: true })
  placedById: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

