import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LoanProduct } from './loan-product.entity';

@Entity('loan_product_loan_partners')
@Index(['loanProductId', 'loanPartnerId'], { unique: true })
export class LoanProductLoanPartner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  loanProductId: string;

  @ManyToOne(() => LoanProduct, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loanProductId' })
  loanProduct: LoanProduct;

  @Column('uuid')
  loanPartnerId: string; // Link to Loan Partner

  @Column('decimal', { precision: 5, scale: 2 })
  partnerLoanSharePercentage: number; // 1-99

  @Column('decimal', { precision: 5, scale: 2 })
  partnerBaseInterestRate: number;

  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;
}

