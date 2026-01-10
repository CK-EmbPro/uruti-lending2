import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { FeeType } from '../../../common/enums/fee-type.enum';

@Entity('fee_schedules')
@Index(['feeCode'], { unique: true })
@Index(['feeType'])
@Index(['effectiveDate'])
@Index(['companyId'])
export class FeeSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  feeCode: string;

  @Column()
  feeName: string;

  @Column({
    type: 'enum',
    enum: FeeType,
  })
  feeType: FeeType;

  @Column()
  companyId: string;

  // Fee Amount Configuration
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  fixedAmount: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  percentageAmount: number; // Percentage of loan amount

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minimumAmount: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maximumAmount: number;

  // Effective Date
  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  // Grandfathering
  @Column({ type: 'boolean', default: false })
  grandfatherExistingAccounts: boolean;

  @Column({ type: 'date', nullable: true })
  grandfatherCutoffDate: Date; // Accounts created before this date are grandfathered

  // Promotional Settings
  @Column({ type: 'boolean', default: false })
  isPromotional: boolean;

  @Column({ type: 'date', nullable: true })
  promotionalStartDate: Date;

  @Column({ type: 'date', nullable: true })
  promotionalEndDate: Date;

  @Column({ type: 'text', nullable: true })
  promotionalTerms: string;

  // Application Rules
  @Column({ type: 'jsonb', nullable: true })
  applicableLoanProducts: string[]; // Product IDs where this fee applies

  @Column({ type: 'jsonb', nullable: true })
  applicableLoanTypes: string[]; // Loan types where this fee applies

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Notification
  @Column({ type: 'boolean', default: false })
  notificationSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  notificationSentAt: Date;

  @Column({ type: 'int', nullable: true })
  affectedCustomersCount: number;

  @Column({ type: 'text', nullable: true })
  notificationMessage: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

