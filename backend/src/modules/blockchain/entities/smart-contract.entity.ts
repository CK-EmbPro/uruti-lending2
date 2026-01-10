import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BlockchainType } from '../dto/blockchain.dto';

@Entity('smart_contracts')
@Index(['contractAddress'], { unique: true })
@Index(['contractName'])
@Index(['isActive'])
export class SmartContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  contractAddress: string;

  @Column()
  contractName: string;

  @Column({
    type: 'enum',
    enum: BlockchainType,
  })
  blockchainType: BlockchainType;

  @Column()
  network: string;

  @Column({ type: 'jsonb' })
  abi: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  bytecode: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  transactionCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deployedBy: string;
}

