import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RiskTier {
  PRIME = 'PRIME',
  STANDARD = 'STANDARD',
  MONITORED = 'MONITORED',
  HIGH_RISK = 'HIGH_RISK',
}

@Entity('risk_tier_configs')
@Index(['companyId'])
@Index(['tier', 'isActive'])
export class RiskTierConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({
    type: 'enum',
    enum: RiskTier,
  })
  tier: RiskTier;

  @Column({ type: 'int' })
  minScore: number; // Minimum credit score for this tier

  @Column({ type: 'int' })
  maxScore: number; // Maximum credit score for this tier

  @Column({ type: 'varchar', length: 100 })
  displayName: string; // Display name (e.g., "Prime", "Standard")

  @Column({ type: 'text', nullable: true })
  description: string; // Tier description

  // Approval Configuration
  @Column({ type: 'boolean', default: true })
  autoApproveEnabled: boolean; // Can auto-approve applications in this tier

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxAutoApproveAmount: number; // Maximum amount for auto-approval

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  minInterestRate: number; // Minimum interest rate for this tier

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxInterestRate: number; // Maximum interest rate for this tier

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  defaultInterestRate: number; // Default interest rate for this tier

  // Loan Limits
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxLoanAmount: number; // Maximum loan amount for this tier

  @Column({ type: 'int', nullable: true })
  maxLoanTerm: number; // Maximum loan term in months

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxDebtToIncomeRatio: number; // Maximum DTI for this tier

  // Workflow Configuration
  @Column({ type: 'jsonb', nullable: true })
  approvalWorkflow: {
    requiresManualReview: boolean;
    requiresCoSigner: boolean;
    requiresCollateral: boolean;
    requiresAdditionalDocuments: string[];
    approvalLevels: string[]; // Approval authority levels required
  };

  // Display Configuration
  @Column({ type: 'varchar', length: 7, nullable: true })
  badgeColor: string; // Hex color for tier badge

  @Column({ type: 'varchar', length: 255, nullable: true })
  iconUrl: string; // Icon URL for tier

  @Column({ type: 'jsonb', nullable: true })
  benefits: string[]; // Tier benefits (e.g., "Lower interest rates", "Faster approval")

  @Column({ type: 'jsonb', nullable: true })
  limitations: string[]; // Tier limitations (e.g., "Lower loan limits", "Requires co-signer")

  // Status
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number; // Priority order (lower = higher priority)

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

