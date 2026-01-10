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
import { Currency } from './currency.entity';
import { Loan } from '../../loan/entities/loan.entity';

export enum ExposureType {
  LOAN_OUTSTANDING = 'LOAN_OUTSTANDING',
  INTEREST_ACCRUED = 'INTEREST_ACCRUED',
  PRINCIPAL_DUE = 'PRINCIPAL_DUE',
  INTEREST_DUE = 'INTEREST_DUE',
}

@Entity('fx_exposures')
@Index(['loanId', 'currencyId', 'exposureType'], { unique: true })
@Index(['asOfDate', 'currencyId'])
export class FXExposure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({ type: 'uuid' })
  currencyId: string;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'currencyId' })
  currency: Currency;

  @Column({ type: 'enum', enum: ExposureType })
  exposureType: ExposureType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  exposureAmount: number; // Exposure amount in foreign currency

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  exchangeRate: number; // Exchange rate used for calculation

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  baseCurrencyAmount: number; // Amount in base currency

  @Column({ type: 'date' })
  asOfDate: Date; // Date of exposure calculation

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  unrealizedGainLoss: number | null; // Unrealized FX gain/loss

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

