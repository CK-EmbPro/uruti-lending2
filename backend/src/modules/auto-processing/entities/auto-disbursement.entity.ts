import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DisbursementStatus, DisbursementMethod, AccountVerificationStatus } from '../dto/auto-disbursement.dto';

@Entity('auto_disbursements')
@Index(['loanId'])
@Index(['status'])
@Index(['createdAt'])
export class AutoDisbursement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @Column({
    type: 'enum',
    enum: DisbursementStatus,
    default: DisbursementStatus.PENDING,
  })
  status: DisbursementStatus;

  @Column({
    type: 'enum',
    enum: DisbursementMethod,
  })
  method: DisbursementMethod;

  @Column({
    type: 'enum',
    enum: AccountVerificationStatus,
    default: AccountVerificationStatus.PENDING,
  })
  accountVerificationStatus: AccountVerificationStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'jsonb' })
  accountDetails: {
    accountNumber: string;
    accountHolderName: string;
    bankName?: string;
    bankCode?: string;
  };

  @Column({ type: 'int', default: 0 })
  attemptCount: number;

  @Column({ type: 'jsonb', nullable: true })
  attempts: Array<{
    attemptNumber: number;
    timestamp: Date;
    success: boolean;
    errorMessage?: string;
    externalReference?: string;
  }>;

  @Column({ type: 'bigint', nullable: true })
  processingTimeMs: number; // Time from approval to disbursement

  @Column({ nullable: true })
  externalReference: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

