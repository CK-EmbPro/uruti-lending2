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
import { ExtensionStatus } from '../../../common/enums/extension-status.enum';
import { ExtensionType } from '../../../common/enums/extension-type.enum';

@Entity('payment_extensions')
@Index(['loanId'])
@Index(['requestDate'])
@Index(['status'])
export class PaymentExtension {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'date' })
  requestDate: Date;

  @Column({ type: 'date' })
  originalDueDate: Date;

  @Column({ type: 'date', nullable: true })
  newDueDate: Date;

  @Column({ type: 'int', nullable: true })
  extensionDays: number;

  @Column({
    type: 'enum',
    enum: ExtensionStatus,
    default: ExtensionStatus.PENDING,
  })
  status: ExtensionStatus;

  @Column({
    type: 'enum',
    enum: ExtensionType,
  })
  extensionType: ExtensionType;

  @Column({ type: 'text', nullable: true })
  requestReason: string;

  @Column({ type: 'text', nullable: true })
  hardshipDetails: string;

  @Column({ type: 'boolean', default: false })
  approved: boolean;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedById: string;

  @Column({ type: 'date', nullable: true })
  approvedDate: Date;

  @Column({ type: 'text', nullable: true })
  approvalRemarks: string;

  @Column({ type: 'text', nullable: true })
  denialReason: string;

  @Column({ nullable: true })
  requestedBy: string; // Borrower name

  @Column({ nullable: true })
  requestedById: string; // Borrower ID

  @Column({ nullable: true })
  processedBy: string; // CSR name

  @Column({ nullable: true })
  processedById: string; // CSR ID

  @Column({ type: 'boolean', default: false })
  borrowerNotified: boolean;

  @Column({ type: 'date', nullable: true })
  borrowerNotifiedDate: Date;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

