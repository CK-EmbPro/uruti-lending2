import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskTierConfig, RiskTier } from '../entities/risk-tier-config.entity';

/**
 * Service for managing risk tier classification and configuration
 * Handles tier assignment, tier-based rules, and tier information
 */
@Injectable()
export class RiskTierService {
  private readonly logger = new Logger(RiskTierService.name);

  // Default tier thresholds (used if no config exists)
  private readonly DEFAULT_TIERS = {
    [RiskTier.PRIME]: { min: 750, max: 850 },
    [RiskTier.STANDARD]: { min: 650, max: 749 },
    [RiskTier.MONITORED]: { min: 550, max: 649 },
    [RiskTier.HIGH_RISK]: { min: 300, max: 549 },
  };

  constructor(
    @InjectRepository(RiskTierConfig)
    private readonly tierConfigRepository: Repository<RiskTierConfig>,
  ) {}

  /**
   * Assign risk tier based on credit score
   */
  async assignRiskTier(score: number, companyId?: string): Promise<RiskTier> {
    // Get tier configurations for company (or use defaults)
    const tierConfigs = companyId
      ? await this.getActiveTierConfigs(companyId)
      : null;

    if (tierConfigs && tierConfigs.length > 0) {
      // Use configured tiers
      for (const config of tierConfigs.sort((a, b) => b.priority - a.priority)) {
        if (score >= config.minScore && score <= config.maxScore) {
          return config.tier;
        }
      }
    }

    // Fallback to default tiers
    if (score >= 750) return RiskTier.PRIME;
    if (score >= 650) return RiskTier.STANDARD;
    if (score >= 550) return RiskTier.MONITORED;
    return RiskTier.HIGH_RISK;
  }

  /**
   * Get tier configuration for a specific tier
   */
  async getTierConfig(
    tier: RiskTier,
    companyId: string,
  ): Promise<RiskTierConfig | null> {
    return await this.tierConfigRepository.findOne({
      where: {
        tier,
        companyId,
        isActive: true,
      },
      order: {
        priority: 'ASC',
      },
    });
  }

  /**
   * Get all active tier configurations for a company
   */
  async getActiveTierConfigs(companyId: string): Promise<RiskTierConfig[]> {
    return await this.tierConfigRepository.find({
      where: {
        companyId,
        isActive: true,
      },
      order: {
        priority: 'ASC',
        minScore: 'DESC', // Highest scores first
      },
    });
  }

  /**
   * Get tier information for display (includes description, benefits, etc.)
   */
  async getTierInfo(tier: RiskTier, companyId?: string): Promise<{
    tier: RiskTier;
    displayName: string;
    description: string;
    badgeColor: string;
    iconUrl: string | null;
    benefits: string[];
    limitations: string[];
    scoreRange: { min: number; max: number };
    approvalRules: {
      autoApproveEnabled: boolean;
      maxAutoApproveAmount: number | null;
      minInterestRate: number | null;
      maxInterestRate: number | null;
      defaultInterestRate: number | null;
      maxLoanAmount: number | null;
      maxLoanTerm: number | null;
      maxDebtToIncomeRatio: number | null;
    };
  }> {
    const config = companyId ? await this.getTierConfig(tier, companyId) : null;

    if (config) {
      return {
        tier: config.tier,
        displayName: config.displayName,
        description: config.description || this.getDefaultDescription(tier),
        badgeColor: config.badgeColor || this.getDefaultBadgeColor(tier),
        iconUrl: config.iconUrl,
        benefits: config.benefits || [],
        limitations: config.limitations || [],
        scoreRange: {
          min: config.minScore,
          max: config.maxScore,
        },
        approvalRules: {
          autoApproveEnabled: config.autoApproveEnabled,
          maxAutoApproveAmount: config.maxAutoApproveAmount,
          minInterestRate: config.minInterestRate,
          maxInterestRate: config.maxInterestRate,
          defaultInterestRate: config.defaultInterestRate,
          maxLoanAmount: config.maxLoanAmount,
          maxLoanTerm: config.maxLoanTerm,
          maxDebtToIncomeRatio: config.maxDebtToIncomeRatio,
        },
      };
    }

    // Return default tier info
    const defaultRange = this.DEFAULT_TIERS[tier];
    return {
      tier,
      displayName: this.getDefaultDisplayName(tier),
      description: this.getDefaultDescription(tier),
      badgeColor: this.getDefaultBadgeColor(tier),
      iconUrl: null,
      benefits: this.getDefaultBenefits(tier),
      limitations: this.getDefaultLimitations(tier),
      scoreRange: defaultRange,
      approvalRules: this.getDefaultApprovalRules(tier),
    };
  }

  /**
   * Check if application can be auto-approved based on tier
   */
  async canAutoApprove(
    tier: RiskTier,
    requestedAmount: number,
    companyId: string,
  ): Promise<{ canApprove: boolean; reason?: string }> {
    const config = await this.getTierConfig(tier, companyId);

    if (!config) {
      // Use default rules
      const defaultRules = this.getDefaultApprovalRules(tier);
      if (!defaultRules.autoApproveEnabled) {
        return { canApprove: false, reason: 'Auto-approval not enabled for this tier' };
      }
      if (defaultRules.maxAutoApproveAmount && requestedAmount > defaultRules.maxAutoApproveAmount) {
        return {
          canApprove: false,
          reason: `Requested amount exceeds maximum auto-approve limit of $${defaultRules.maxAutoApproveAmount.toLocaleString()}`,
        };
      }
      return { canApprove: true };
    }

    if (!config.autoApproveEnabled) {
      return { canApprove: false, reason: 'Auto-approval not enabled for this tier' };
    }

    if (config.maxAutoApproveAmount && requestedAmount > config.maxAutoApproveAmount) {
      return {
        canApprove: false,
        reason: `Requested amount exceeds maximum auto-approve limit of $${config.maxAutoApproveAmount.toLocaleString()}`,
      };
    }

    if (config.maxLoanAmount && requestedAmount > config.maxLoanAmount) {
      return {
        canApprove: false,
        reason: `Requested amount exceeds maximum loan amount of $${config.maxLoanAmount.toLocaleString()}`,
      };
    }

    return { canApprove: true };
  }

  /**
   * Get interest rate for tier
   */
  async getInterestRate(
    tier: RiskTier,
    companyId: string,
    requestedAmount?: number,
  ): Promise<number> {
    const config = await this.getTierConfig(tier, companyId);

    if (config && config.defaultInterestRate) {
      return config.defaultInterestRate;
    }

    // Default rates
    const defaultRates = {
      [RiskTier.PRIME]: 5.0,
      [RiskTier.STANDARD]: 7.5,
      [RiskTier.MONITORED]: 10.5,
      [RiskTier.HIGH_RISK]: 15.0,
    };

    return defaultRates[tier] || 10.0;
  }

  /**
   * Get maximum loan amount for tier
   */
  async getMaxLoanAmount(tier: RiskTier, companyId: string): Promise<number | null> {
    const config = await this.getTierConfig(tier, companyId);
    return config?.maxLoanAmount || null;
  }

  // Default values

  private getDefaultDisplayName(tier: RiskTier): string {
    const names = {
      [RiskTier.PRIME]: 'Prime',
      [RiskTier.STANDARD]: 'Standard',
      [RiskTier.MONITORED]: 'Monitored',
      [RiskTier.HIGH_RISK]: 'High Risk',
    };
    return names[tier] || tier;
  }

  private getDefaultDescription(tier: RiskTier): string {
    const descriptions = {
      [RiskTier.PRIME]: 'Excellent credit profile with low risk. Eligible for best rates and highest loan amounts.',
      [RiskTier.STANDARD]: 'Good credit profile with moderate risk. Eligible for competitive rates and standard loan amounts.',
      [RiskTier.MONITORED]: 'Fair credit profile requiring closer monitoring. Eligible for loans with higher rates and lower limits.',
      [RiskTier.HIGH_RISK]: 'Higher risk profile requiring manual review. Limited loan options with higher rates and stricter terms.',
    };
    return descriptions[tier] || '';
  }

  private getDefaultBadgeColor(tier: RiskTier): string {
    const colors = {
      [RiskTier.PRIME]: '#10B981', // Green
      [RiskTier.STANDARD]: '#3B82F6', // Blue
      [RiskTier.MONITORED]: '#F59E0B', // Amber
      [RiskTier.HIGH_RISK]: '#EF4444', // Red
    };
    return colors[tier] || '#6B7280';
  }

  private getDefaultBenefits(tier: RiskTier): string[] {
    const benefits = {
      [RiskTier.PRIME]: [
        'Lowest interest rates',
        'Highest loan amounts',
        'Fastest approval process',
        'Flexible repayment terms',
      ],
      [RiskTier.STANDARD]: [
        'Competitive interest rates',
        'Good loan amounts',
        'Quick approval process',
        'Standard repayment terms',
      ],
      [RiskTier.MONITORED]: [
        'Access to credit',
        'Opportunity to improve credit',
        'Structured repayment plans',
      ],
      [RiskTier.HIGH_RISK]: [
        'Access to credit with review',
        'Opportunity to rebuild credit',
      ],
    };
    return benefits[tier] || [];
  }

  private getDefaultLimitations(tier: RiskTier): string[] {
    const limitations = {
      [RiskTier.PRIME]: [],
      [RiskTier.STANDARD]: [],
      [RiskTier.MONITORED]: [
        'Higher interest rates',
        'Lower loan limits',
        'May require additional documentation',
      ],
      [RiskTier.HIGH_RISK]: [
        'Highest interest rates',
        'Lowest loan limits',
        'Requires manual review',
        'May require co-signer or collateral',
      ],
    };
    return limitations[tier] || [];
  }

  private getDefaultApprovalRules(tier: RiskTier): {
    autoApproveEnabled: boolean;
    maxAutoApproveAmount: number | null;
    minInterestRate: number | null;
    maxInterestRate: number | null;
    defaultInterestRate: number | null;
    maxLoanAmount: number | null;
    maxLoanTerm: number | null;
    maxDebtToIncomeRatio: number | null;
  } {
    const rules = {
      [RiskTier.PRIME]: {
        autoApproveEnabled: true,
        maxAutoApproveAmount: 100000,
        minInterestRate: 4.0,
        maxInterestRate: 6.0,
        defaultInterestRate: 5.0,
        maxLoanAmount: 500000,
        maxLoanTerm: 84,
        maxDebtToIncomeRatio: 0.43,
      },
      [RiskTier.STANDARD]: {
        autoApproveEnabled: true,
        maxAutoApproveAmount: 50000,
        minInterestRate: 6.0,
        maxInterestRate: 9.0,
        defaultInterestRate: 7.5,
        maxLoanAmount: 200000,
        maxLoanTerm: 60,
        maxDebtToIncomeRatio: 0.50,
      },
      [RiskTier.MONITORED]: {
        autoApproveEnabled: true,
        maxAutoApproveAmount: 25000,
        minInterestRate: 9.0,
        maxInterestRate: 12.0,
        defaultInterestRate: 10.5,
        maxLoanAmount: 100000,
        maxLoanTerm: 48,
        maxDebtToIncomeRatio: 0.55,
      },
      [RiskTier.HIGH_RISK]: {
        autoApproveEnabled: false,
        maxAutoApproveAmount: null,
        minInterestRate: 12.0,
        maxInterestRate: 18.0,
        defaultInterestRate: 15.0,
        maxLoanAmount: 50000,
        maxLoanTerm: 36,
        maxDebtToIncomeRatio: 0.60,
      },
    };
    return rules[tier] || rules[RiskTier.HIGH_RISK];
  }
}

