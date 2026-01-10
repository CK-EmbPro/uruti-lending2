import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CurrencyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity('currencies')
@Index(['code'], { unique: true })
@Index(['status'])
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 3 })
  code: string; // ISO 4217 currency code (USD, EUR, GBP, etc.)

  @Column()
  name: string; // Full currency name (US Dollar, Euro, etc.)

  @Column({ length: 10, nullable: true })
  symbol: string | null; // Currency symbol ($, €, £, etc.)

  @Column({ type: 'int', default: 2 })
  decimalPlaces: number; // Number of decimal places (default: 2)

  @Column({ type: 'enum', enum: CurrencyStatus, default: CurrencyStatus.ACTIVE })
  status: CurrencyStatus;

  @Column({ type: 'boolean', default: false })
  isBaseCurrency: boolean; // Is this the base currency for the system?

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  exchangeRate: number | null; // Current exchange rate to base currency

  @Column({ type: 'timestamp', nullable: true })
  exchangeRateDate: Date | null; // Date of last exchange rate update

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Additional currency metadata

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

