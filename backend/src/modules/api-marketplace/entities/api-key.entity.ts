import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum APIKeyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

@Entity('api_keys')
@Index(['companyId'])
@Index(['status'])
@Index(['apiKey'], { unique: true })
export class APIKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ unique: true })
  apiKey: string; // Hashed API key

  @Column({
    type: 'enum',
    enum: APIKeyStatus,
    default: APIKeyStatus.ACTIVE,
  })
  status: APIKeyStatus;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'int', nullable: true })
  rateLimit: number; // Requests per minute

  @Column({ type: 'json', nullable: true })
  allowedIPs: string[];

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

