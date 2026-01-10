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

export enum ExchangeRateSource {
  MANUAL = 'MANUAL',
  API = 'API',
  BANK = 'BANK',
  MARKET = 'MARKET',
}

@Entity('exchange_rates')
@Index(['fromCurrencyId', 'toCurrencyId', 'rateDate'], { unique: true })
@Index(['rateDate'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  fromCurrencyId: string;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'fromCurrencyId' })
  fromCurrency: Currency;

  @Column({ type: 'uuid' })
  toCurrencyId: string;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'toCurrencyId' })
  toCurrency: Currency;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  rate: number; // Exchange rate: 1 fromCurrency = rate toCurrency

  @Column({ type: 'date' })
  rateDate: Date; // Date for which this rate is valid

  @Column({ type: 'enum', enum: ExchangeRateSource, default: ExchangeRateSource.MANUAL })
  source: ExchangeRateSource;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceReference: string | null; // Reference to source (API provider, bank name, etc.)

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  buyRate: number | null; // Buy rate (if different from sell rate)

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  sellRate: number | null; // Sell rate (if different from buy rate)

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

