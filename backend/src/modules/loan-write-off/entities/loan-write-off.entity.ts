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
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('loan_write_offs')
@Index(['loanId'])
@Index(['postingDate'])
@Index(['companyId'])
export class LoanWriteOff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => LoanProduct, { nullable: true })
  loanProduct: LoanProduct;

  @Column({ nullable: true })
  loanProductId: string;

  @ManyToOne(() => Company)
  company: Company;

  @Column()
  companyId: string;

  @Column({ type: 'date' })
  postingDate: Date;

  @Column({ type: 'date' })
  valueDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  writeOffAmount: number;

  @Column({ nullable: true })
  writeOffAccount: string;

  @Column({ nullable: true })
  costCenter: string;

  @Column({ type: 'boolean', default: false })
  isNpa: boolean;

  @Column({ type: 'boolean', default: false })
  isSettlementWriteOff: boolean;

  @Column({ nullable: true })
  loanDisbursementId: string;

  @Column({ nullable: true })
  applicantType: string;

  @Column({ nullable: true })
  applicantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

