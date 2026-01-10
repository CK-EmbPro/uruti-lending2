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
import { AutoPayFrequency } from '../dto/customer-portal-enhanced.dto';
import { Loan } from '../../loan/entities/loan.entity';
import { CustomerPaymentMethod } from './payment-method.entity';

@Entity('customer_auto_pay')
@Index(['customerId'])
@Index(['loanId'])
@Index(['isActive'])
export class CustomerAutoPay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column()
  paymentMethodId: string;

  @ManyToOne(() => CustomerPaymentMethod)
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod: CustomerPaymentMethod;

  @Column({
    type: 'enum',
    enum: AutoPayFrequency,
  })
  frequency: AutoPayFrequency;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  amount: number; // null = minimum payment

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  nextPaymentDate: Date;

  @Column({ type: 'date', nullable: true })
  lastPaymentDate: Date;

  @Column({ type: 'int', default: 0 })
  paymentCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

