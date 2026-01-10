import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { LoanSecurityAssignment } from './loan-security-assignment.entity';

@Entity('pledges')
@Index(['loanSecurityAssignmentId'])
export class Pledge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoanSecurityAssignment, (assignment) => assignment.pledges)
  loanSecurityAssignment: LoanSecurityAssignment;

  @Column()
  loanSecurityAssignmentId: string;

  @Column()
  loanSecurityId: string; // Reference to Loan Security master

  @Column('decimal', { precision: 15, scale: 2 })
  qty: number; // Quantity of security pledged

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  loanSecurityPrice: number; // Price at time of pledge

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  haircut: number; // Haircut percentage

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number; // qty * loanSecurityPrice

  @Column('decimal', { precision: 15, scale: 2 })
  postHaircutAmount: number; // amount * (1 - haircut/100)

  @CreateDateColumn()
  createdAt: Date;
}

