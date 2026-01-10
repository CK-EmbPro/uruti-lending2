import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ExternalLoanApplication } from './external-loan-application.entity';

export enum PlatformStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended',
}

@Entity('third_party_platforms')
@Index(['platformCode'], { unique: true })
@Index(['status'])
export class ThirdPartyPlatform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  platformCode: string; // e.g., 'URUTIX', 'CARGO-MATCH'

  @Column()
  platformName: string; // e.g., 'UrutiX Platform'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PlatformStatus,
    default: PlatformStatus.ACTIVE,
  })
  status: PlatformStatus;

  // API Authentication
  @Column({ unique: true })
  apiKey: string; // API key for authentication

  @Column({ nullable: true })
  apiSecret: string; // API secret for HMAC signing

  // Webhook Configuration
  @Column({ nullable: true })
  webhookUrl: string; // URL to send webhook notifications

  @Column({ nullable: true })
  webhookSecret: string; // Secret for webhook signature verification

  // Allowed Operations
  @Column({ type: 'boolean', default: true })
  canCreateCustomers: boolean;

  @Column({ type: 'boolean', default: true })
  canCreateApplications: boolean;

  @Column({ type: 'boolean', default: true })
  canPostRepayments: boolean;

  @Column({ type: 'boolean', default: true })
  canQueryLoanStatus: boolean;

  // Rate Limiting
  @Column({ type: 'int', default: 1000 })
  rateLimitPerMinute: number;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional platform-specific data

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => ExternalLoanApplication, (app) => app.platform)
  externalApplications: ExternalLoanApplication[];
}

