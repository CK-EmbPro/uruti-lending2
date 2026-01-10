import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LoanPartnerShareable } from './loan-partner-shareable.entity';

export enum FldgType {
  FIXED_DEPOSIT_ONLY = 'Fixed Deposit Only',
  CORPORATE_GUARANTEE_ONLY = 'Corporate Guarantee Only',
  BOTH = 'Both Fixed Deposit and Corporate Guarantee',
}

export enum FldgLimitCalculationComponent {
  DISBURSEMENT = 'Disbursement',
  OUTSTANDING_PRINCIPAL = 'Outstanding Principal',
  OUTSTANDING_PRINCIPAL_AND_INTEREST = 'Outstanding Principal & Interest Accrued',
}

export enum RepaymentScheduleType {
  EMI_PMT_BASED = 'EMI (PMT) based',
  COLLECTION_AT_PARTNER_PERCENTAGE = "Collection at partner's percentage",
  POS_REDUCTION_PLUS_INTEREST = 'POS reduction plus interest at partner ROI',
}

export enum OrganizationType {
  CENTRALIZED = 'Centralized',
  DECENTRALIZED = 'Decentralized',
}

@Entity('loan_partners')
@Index(['partnerCode'], { unique: true })
export class LoanPartner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  partnerCode: string;

  @Column()
  partnerName: string;

  @Column('decimal', { precision: 5, scale: 2 })
  partnerLoanSharePercentage: number; // 1-99

  @Column('decimal', { precision: 5, scale: 2 })
  partnerBaseInterestRate: number;

  @Column({ type: 'date' })
  effectiveDate: Date;

  // FLDG Configuration
  @Column({ type: 'int', nullable: true })
  fldgTriggerDpd: number; // DPD threshold to trigger FLDG

  @Column({
    type: 'enum',
    enum: FldgLimitCalculationComponent,
    nullable: true,
  })
  fldgLimitCalculationComponent: FldgLimitCalculationComponent;

  @Column({
    type: 'enum',
    enum: FldgType,
    nullable: true,
  })
  typeOfFldgApplicable: FldgType;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fldgFixedDepositPercentage: number; // 1-99

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fldgCorporateGuaranteePercentage: number; // 1-99

  // Repayment Schedule Type
  @Column({
    type: 'enum',
    enum: RepaymentScheduleType,
    default: RepaymentScheduleType.EMI_PMT_BASED,
  })
  repaymentScheduleType: RepaymentScheduleType;

  // Organization Type
  @Column({
    type: 'enum',
    enum: OrganizationType,
    nullable: true,
  })
  organizationType: OrganizationType;

  // Accounting Accounts
  @Column({ nullable: true })
  payableAccount: string; // Link to Account

  @Column({ nullable: true })
  receivableAccount: string; // Link to Account

  @Column({ nullable: true })
  creditAccount: string; // Link to Account

  @Column({ nullable: true })
  fldgAccount: string; // Link to Account for FLDG

  @Column({ nullable: true })
  partnerInterestShare: string; // Link to Account

  @Column({ type: 'boolean', default: false })
  enablePartnerAccounting: boolean;

  // Options
  @Column({ type: 'boolean', default: false })
  servicerFee: boolean;

  @Column({ type: 'boolean', default: false })
  restructureOfLoansApplicable: boolean;

  @Column({ type: 'boolean', default: false })
  waivingOfChargesApplicable: boolean;

  @Column({ type: 'text', nullable: true })
  partialPaymentMechanism: string;

  // Shareables
  @OneToMany(
    () => LoanPartnerShareable,
    (shareable) => shareable.loanPartner,
    { cascade: true, eager: false },
  )
  shareables: LoanPartnerShareable[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

