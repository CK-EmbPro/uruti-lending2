import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CustomerPortalUser } from './customer-portal-user.entity';
import { Loan } from '../../loan/entities/loan.entity';

@Entity('customer_loan_links')
@Index(['customerId', 'loanId'], { unique: true })
@Index(['loanId'])
@Index(['customerId'])
export class CustomerLoanLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CustomerPortalUser, { eager: false })
  customer: CustomerPortalUser;

  @Column()
  customerId: string;

  @ManyToOne(() => Loan, { eager: false })
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationMethod: string; // 'LOAN_NUMBER', 'SSN', 'PHONE', 'MANUAL'

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  verifiedBy: string; // Customer ID or admin ID

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  rejectedBy: string;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @Column({ type: 'json', nullable: true })
  verificationData: Record<string, any>; // Store additional verification info (phone, SSN, etc.)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

