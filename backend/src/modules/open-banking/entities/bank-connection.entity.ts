import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BankConnectionStatus } from '../dto/open-banking.dto';

@Entity('bank_connections')
@Index(['customerId'])
@Index(['status'])
@Index(['provider'])
export class BankConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  provider: string; // plaid, yodlee, etc.

  @Column()
  accessToken: string; // Encrypted access token

  @Column({ nullable: true })
  itemId: string; // Provider item ID

  @Column({
    type: 'enum',
    enum: BankConnectionStatus,
    default: BankConnectionStatus.PENDING,
  })
  status: BankConnectionStatus;

  @Column({ type: 'timestamp', nullable: true })
  connectedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

