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
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';

export enum ListingStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  MATCHED = 'MATCHED',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
}

export enum ListingType {
  PRIMARY = 'PRIMARY', // New loan listing
  SECONDARY = 'SECONDARY', // Existing loan for sale
}

export enum AuctionType {
  FIXED_PRICE = 'FIXED_PRICE',
  DUTCH_AUCTION = 'DUTCH_AUCTION',
  ENGLISH_AUCTION = 'ENGLISH_AUCTION',
}

@Entity('loan_marketplace_listings')
@Index(['status', 'listingType', 'createdAt'])
@Index(['loanProductId', 'status'])
export class LoanMarketplaceListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  loanApplicationId: string | null; // For primary listings

  @ManyToOne(() => LoanApplication, { nullable: true })
  @JoinColumn({ name: 'loanApplicationId' })
  loanApplication: LoanApplication | null;

  @Column({ type: 'uuid', nullable: true })
  loanId: string | null; // For secondary listings

  @Column({ type: 'uuid' })
  loanProductId: string;

  @ManyToOne(() => LoanProduct)
  @JoinColumn({ name: 'loanProductId' })
  loanProduct: LoanProduct;

  @Column({ type: 'enum', enum: ListingType })
  listingType: ListingType;

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.DRAFT })
  status: ListingStatus;

  @Column({ type: 'enum', enum: AuctionType, default: AuctionType.FIXED_PRICE })
  auctionType: AuctionType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  loanAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  interestRate: number;

  @Column({ type: 'int' })
  tenureMonths: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  minInterestRate: number | null; // For auctions

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxInterestRate: number | null; // For auctions

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  reservePrice: number | null; // For auctions

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  committedAmount: number; // Amount committed by investors

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  bidCount: number;

  @Column({ type: 'date', nullable: true })
  listingExpiryDate: Date | null;

  @Column({ type: 'date', nullable: true })
  fundingDeadline: Date | null;

  @Column({ type: 'json', nullable: true })
  borrowerProfile: Record<string, any>; // Anonymized borrower info

  @Column({ type: 'json', nullable: true })
  riskMetrics: Record<string, any>; // Risk scores, credit rating, etc.

  @Column({ type: 'json', nullable: true })
  terms: Record<string, any>; // Listing terms

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('loan_marketplace_bids')
@Index(['listingId', 'investorId'])
@Index(['listingId', 'status', 'bidAmount'])
export class LoanMarketplaceBid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  listingId: string;

  @ManyToOne(() => LoanMarketplaceListing)
  @JoinColumn({ name: 'listingId' })
  listing: LoanMarketplaceListing;

  @Column({ type: 'uuid' })
  investorId: string; // Investor/lender ID

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  bidAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  proposedInterestRate: number | null; // For auctions

  @Column({ type: 'enum', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'], default: 'PENDING' })
  status: string;

  @Column({ type: 'boolean', default: false })
  isWinningBid: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

