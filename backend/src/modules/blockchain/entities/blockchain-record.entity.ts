import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RecordType, VerificationStatus } from '../dto/blockchain.dto';

@Entity('blockchain_records')
@Index(['entityId', 'entityType'])
@Index(['transactionHash'], { unique: true })
@Index(['recordType'])
@Index(['verificationStatus'])
@Index(['blockNumber'])
export class BlockchainRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RecordType,
  })
  recordType: RecordType;

  @Column()
  entityId: string;

  @Column()
  entityType: string;

  @Column({ unique: true })
  transactionHash: string;

  @Column({ type: 'bigint' })
  blockNumber: number;

  @Column()
  blockHash: string;

  @Column()
  dataHash: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column({ nullable: true })
  network: string;

  @Column({ nullable: true })
  contractAddress: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'text', nullable: true })
  verificationError: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

