import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DataSource {
  TRANSACTION_HISTORY = 'TRANSACTION_HISTORY',
  UTILITY_PAYMENTS = 'UTILITY_PAYMENTS',
  RENTAL_PAYMENTS = 'RENTAL_PAYMENTS',
  MOBILE_PHONE = 'MOBILE_PHONE',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  PSYCHOMETRIC = 'PSYCHOMETRIC',
  CASH_FLOW = 'CASH_FLOW',
  EMPLOYMENT = 'EMPLOYMENT',
  EDUCATION = 'EDUCATION',
}

@Entity('alternative_credit_scores')
@Index(['companyId', 'customerId'])
@Index(['score'])
@Index(['calculatedAt'])
export class AlternativeCreditScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  customerId: string;

  @Column({ type: 'int' })
  score: number; // 300-850 scale

  @Column({ type: 'json' })
  scoreRange: { min: number; max: number };

  @Column({ type: 'json', default: [] })
  dataSources: string[];

  @Column({ type: 'json' })
  scoreBreakdown: {
    transactionHistory: number;
    utilityPayments: number;
    rentalPayments: number;
    cashFlow: number;
    mobilePhone: number;
    other: number;
  };

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  confidenceLevel: number; // 0-1

  @Column({ type: 'json', default: [] })
  riskFactors: string[];

  @Column({ type: 'json', default: [] })
  positiveFactors: string[];

  @Column({ type: 'json', default: [] })
  recommendations: string[];

  @Column({ type: 'json', nullable: true })
  rawData: Record<string, any>;

  @CreateDateColumn()
  calculatedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

