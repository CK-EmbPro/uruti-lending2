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
import { AccountType, BankConnectionStatus } from '../dto/open-banking.dto';
import { BankConnection } from './bank-connection.entity';

@Entity('bank_accounts')
@Index(['customerId'])
@Index(['connectionId'])
@Index(['accountType'])
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  connectionId: string;

  @ManyToOne(() => BankConnection)
  @JoinColumn({ name: 'connectionId' })
  connection: BankConnection;

  @Column()
  providerAccountId: string; // Account ID from provider

  @Column()
  bankName: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  accountType: AccountType;

  @Column()
  accountNumber: string; // Masked

  @Column()
  routingNumber: string; // Masked

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  currentBalance: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  availableBalance: number;

  @Column({
    type: 'enum',
    enum: BankConnectionStatus,
    default: BankConnectionStatus.CONNECTED,
  })
  status: BankConnectionStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
