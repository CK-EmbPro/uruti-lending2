import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LoanPartner } from './loan-partner.entity';

export enum ShareableType {
  PRINCIPAL = 'Principal',
  INTEREST = 'Interest',
  PENALTY = 'Penalty',
  PROCESSING_FEE = 'Processing Fee',
  DISBURSEMENT_FEE = 'Disbursement Fee',
  OTHER_CHARGES = 'Other Charges',
}

export enum SharingParameter {
  COLLECTION_PERCENTAGE = 'Collection Percentage',
  LOAN_AMOUNT_PERCENTAGE = 'Loan Amount Percentage',
}

@Entity('loan_partner_shareables')
export class LoanPartnerShareable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  loanPartnerId: string;

  @ManyToOne(() => LoanPartner, (partner) => partner.shareables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'loanPartnerId' })
  loanPartner: LoanPartner;

  @Column({
    type: 'enum',
    enum: ShareableType,
  })
  shareableType: ShareableType;

  @Column({
    type: 'enum',
    enum: SharingParameter,
  })
  sharingParameter: SharingParameter;

  // For Collection Percentage
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  partnerCollectionPercentage: number; // 1-99

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  companyCollectionPercentage: number; // 1-99 (should be 100 - partner)

  // For Loan Amount Percentage
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  partnerLoanAmountPercentage: number; // 1-99

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  minimumPartnerLoanAmountPercentage: number; // 1-99
}

