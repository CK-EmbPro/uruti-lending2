import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Referral } from './referral.entity';

@Entity('referral_bonuses')
@Index(['referralId'])
@Index(['status'])
export class ReferralBonus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  referralId: string;

  @ManyToOne(() => Referral, (referral) => referral.bonuses)
  @JoinColumn({ name: 'referralId' })
  referral: Referral;

  @Column()
  bonusType: string; // 'Fixed Amount', 'Percentage', 'Tiered'

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  bonusAmount: number;

  @Column({
    type: 'varchar',
    length: '50',
    default: 'Pending',
  })
  status: string; // 'Pending', 'Approved', 'Credited', 'Cancelled'

  @Column({ type: 'timestamp', nullable: true })
  creditedAt: Date;

  @Column({ nullable: true })
  creditedBy: string; // User ID

  @Column({ type: 'text', nullable: true })
  creditNotes: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}














