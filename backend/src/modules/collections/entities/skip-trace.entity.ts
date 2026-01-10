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
import { CollectionActivity } from './collection-activity.entity';

@Entity('skip_traces')
@Index(['loanId'])
@Index(['initiatedDate'])
export class SkipTrace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => CollectionActivity, { nullable: true })
  collectionActivity: CollectionActivity;

  @Column({ nullable: true })
  collectionActivityId: string;

  @Column({ type: 'date' })
  initiatedDate: Date;

  @Column({ nullable: true })
  initiatedBy: string;

  @Column({ nullable: true })
  initiatedById: string;

  @Column({ nullable: true })
  reason: string; // Unreachable, Address Invalid, Phone Disconnected, etc.

  @Column({ nullable: true })
  oldContactPhone: string;

  @Column({ nullable: true })
  oldContactEmail: string;

  @Column({ nullable: true })
  oldAddress: string;

  @Column({ nullable: true })
  newContactPhone: string;

  @Column({ nullable: true })
  newContactEmail: string;

  @Column({ nullable: true })
  newAddress: string;

  @Column({ nullable: true })
  newCity: string;

  @Column({ nullable: true })
  newState: string;

  @Column({ nullable: true })
  newZipCode: string;

  @Column({ nullable: true })
  newCountry: string;

  @Column({ nullable: true })
  searchMethod: string; // Database Search, Third-Party Service, Social Media, Public Records

  @Column({ nullable: true })
  thirdPartyService: string;

  @Column({ nullable: true })
  thirdPartyReference: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  searchCost: number;

  @Column({ type: 'boolean', default: false })
  contactFound: boolean;

  @Column({ type: 'date', nullable: true })
  contactFoundDate: Date;

  @Column({ type: 'boolean', default: false })
  contactVerified: boolean;

  @Column({ type: 'date', nullable: true })
  contactVerifiedDate: Date;

  @Column({ type: 'boolean', default: false })
  newContactAttempted: boolean;

  @Column({ type: 'date', nullable: true })
  newContactAttemptDate: Date;

  @Column({ type: 'boolean', default: false })
  newContactSuccessful: boolean;

  @Column({ type: 'text', nullable: true })
  searchResults: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

