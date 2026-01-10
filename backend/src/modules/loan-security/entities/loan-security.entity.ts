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

@Entity('loan_securities')
@Index(['loanId'])
export class LoanSecurity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column()
  securityType: string; // Property, Vehicle, Guarantee, etc.

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 15, scale: 2 })
  value: number;

  @Column({ type: 'date' })
  pledgedDate: Date;

  @Column({ type: 'date', nullable: true })
  releaseDate: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  documents: string; // JSON array of document references

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

