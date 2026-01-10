import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentArrangement } from './payment-arrangement.entity';

@Entity('arrangement_compliance')
@Index(['arrangementId'])
@Index(['dueDate'])
export class ArrangementCompliance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PaymentArrangement, (arrangement) => arrangement.complianceRecords)
  arrangement: PaymentArrangement;

  @Column()
  arrangementId: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  dueAmount: number;

  @Column({ type: 'boolean', default: false })
  paid: boolean;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'boolean', default: false })
  late: boolean;

  @Column({ type: 'int', nullable: true })
  daysLate: number;

  @Column({ type: 'boolean', default: false })
  missed: boolean;

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

