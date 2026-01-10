import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ReferralStatus } from '../../../common/enums/referral-status.enum';
import { ReferralBonus } from './referral-bonus.entity';

@Entity('referrals')
@Index(['referrerId'])
@Index(['referredCustomerId'])
@Index(['status'])
@Index(['referralCode'], { unique: true })
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  referrerId: string; // Customer who made the referral

  @Column()
  referredCustomerId: string; // Customer who was referred

  @Column({ unique: true })
  referralCode: string; // Unique referral code

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  status: ReferralStatus;

  // Referral details
  @Column({ type: 'timestamp' })
  referralDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  applicationDate: Date;

  @Column({ nullable: true })
  applicationId: string;

  @Column({ type: 'timestamp', nullable: true })
  approvalDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  disbursementDate: Date;

  @Column({ nullable: true })
  loanId: string;

  @Column({ type: 'timestamp', nullable: true })
  completionDate: Date;

  // Bonus tracking
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  bonusAmount: number;

  @Column({ type: 'boolean', default: false })
  bonusCredited: boolean;

  @Column({ type: 'timestamp', nullable: true })
  bonusCreditedAt: Date;

  @Column({ type: 'text', nullable: true })
  bonusNotes: string;

  // Program details
  @Column({ nullable: true })
  referralProgramId: string; // Reference to referral program configuration

  @Column({ type: 'jsonb', nullable: true })
  programTerms: Record<string, any>; // Terms of the referral program

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @OneToMany(() => ReferralBonus, (bonus) => bonus.referral)
  bonuses: ReferralBonus[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}














