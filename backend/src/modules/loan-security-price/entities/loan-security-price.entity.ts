import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('loan_security_prices')
@Index(['loanSecurityId'])
@Index(['validFrom', 'validUpto'])
export class LoanSecurityPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanSecurityId: string; // Reference to Loan Security master

  @Column('decimal', { precision: 15, scale: 2 })
  loanSecurityPrice: number;

  @Column({ type: 'timestamp' })
  validFrom: Date;

  @Column({ type: 'timestamp' })
  validUpto: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

