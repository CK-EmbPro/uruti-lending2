import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { LoanRepayment } from './loan-repayment.entity';

@Entity('prepayment_charges')
@Index(['loanRepaymentId'])
export class PrepaymentCharge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoanRepayment, (repayment) => repayment.prepaymentCharges, {
    onDelete: 'CASCADE',
  })
  loanRepayment: LoanRepayment;

  @Column()
  loanRepaymentId: string;

  @Column({ nullable: true })
  charge: string; // Charge code/item reference

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;
}

