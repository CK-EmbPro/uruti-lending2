import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { LoanProduct } from './loan-product.entity';

export enum ChargeBasedOn {
  PERCENTAGE = 'Percentage',
  FIXED_AMOUNT = 'Fixed Amount',
}

@Entity('loan_charges')
@Index(['loanProductId'])
@Index(['chargeType'])
export class LoanCharge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoanProduct, (product) => product.loanCharges, {
    onDelete: 'CASCADE',
  })
  loanProduct: LoanProduct;

  @Column()
  loanProductId: string;

  @Column()
  chargeType: string; // Charge code/item reference

  @Column({
    type: 'enum',
    enum: ChargeBasedOn,
    default: ChargeBasedOn.FIXED_AMOUNT,
  })
  chargeBasedOn: ChargeBasedOn;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  percentage: number; // Percentage if chargeBasedOn is Percentage

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  amount: number; // Fixed amount if chargeBasedOn is Fixed Amount

  // Charge accounts
  @Column({ nullable: true })
  incomeAccount: string; // Income account for the charge

  @Column({ nullable: true })
  receivableAccount: string; // Receivable account

  @Column({ nullable: true })
  waiverAccount: string; // Waiver account

  @Column({ nullable: true })
  writeOffAccount: string; // Write-off account

  @Column({ nullable: true })
  suspenseAccount: string; // Suspense account
}

