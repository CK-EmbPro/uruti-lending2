import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TransactionCategory } from '../dto/open-banking.dto';
import { BankAccount } from './bank-account.entity';

@Entity('bank_transactions')
@Index(['accountId'])
@Index(['customerId'])
@Index(['transactionDate'])
@Index(['category'])
export class BankTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  accountId: string;

  @ManyToOne(() => BankAccount)
  @JoinColumn({ name: 'accountId' })
  account: BankAccount;

  @Column()
  providerTransactionId: string; // Transaction ID from provider

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TransactionCategory,
    default: TransactionCategory.UNCATEGORIZED,
  })
  category: TransactionCategory;

  @Column({ nullable: true })
  merchant: string;

  @Column({ type: 'boolean', default: false })
  isPending: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
