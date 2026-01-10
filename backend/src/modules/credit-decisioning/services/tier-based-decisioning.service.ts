import { Injectable, Logger } from '@nestjs/common';
import { RiskTierService } from '../../credit-scoring-engine/services/risk-tier.service';
import { RiskTier } from '../../credit-scoring-engine/entities/risk-tier-config.entity';
import { DecisionStatus } from '../dto/credit-decision.dto';

/**
 * Service for tier-based credit decisioning
 * Applies tier-specific approval rules and limits
 */
@Injectable()
export class TierBasedDecisioningService {
  private readonly logger = new Logger(TierBasedDecisioningService.name);

  constructor(private readonly riskTierService: RiskTierService) {}

  /**
   * Make decision based on risk tier
   */
  async makeTierBasedDecision(
    tier: RiskTier,
    requestedAmount: number,
    debtToIncomeRatio: number,
    companyId: string,
  ): Promise<{
    decision: DecisionStatus;
    approvedAmount?: number;
    approvedInterestRate?: number;
    approvedTerm?: number;
    conditions?: string[];
    rationale: string;
  }> {
    const tierInfo = await this.riskTierService.getTierInfo(tier, companyId);
    const approvalRules = tierInfo.approvalRules;

    // Check if can auto-approve
    const canAutoApprove = await this.riskTierService.canAutoApprove(
      tier,
      requestedAmount,
      companyId,
    );

    // Check DTI limit
    if (approvalRules.maxDebtToIncomeRatio && debtToIncomeRatio > approvalRules.maxDebtToIncomeRatio) {
      return {
        decision: DecisionStatus.REJECTED,
        rationale: `Debt-to-income ratio (${(debtToIncomeRatio * 100).toFixed(1)}%) exceeds maximum allowed (${(approvalRules.maxDebtToIncomeRatio * 100).toFixed(1)}%) for ${tierInfo.displayName} tier`,
      };
    }

    // Check loan amount limit
    if (approvalRules.maxLoanAmount && requestedAmount > approvalRules.maxLoanAmount) {
      return {
        decision: DecisionStatus.REJECTED,
        rationale: `Requested amount ($${requestedAmount.toLocaleString()}) exceeds maximum loan amount ($${approvalRules.maxLoanAmount.toLocaleString()}) for ${tierInfo.displayName} tier`,
      };
    }

    // Prime tier - Auto-approve
    if (tier === RiskTier.PRIME && canAutoApprove.canApprove) {
      const approvedAmount = Math.min(requestedAmount, approvalRules.maxAutoApproveAmount || requestedAmount);
      const interestRate = approvalRules.defaultInterestRate || 5.0;
      const maxTerm = approvalRules.maxLoanTerm || 84;

      return {
        decision: DecisionStatus.APPROVED,
        approvedAmount,
        approvedInterestRate: interestRate,
        approvedTerm: maxTerm,
        rationale: `Prime tier borrower - Auto-approved at competitive rate`,
      };
    }

    // Standard tier - Auto-approve with conditions
    if (tier === RiskTier.STANDARD && canAutoApprove.canApprove) {
      const approvedAmount = Math.min(requestedAmount, approvalRules.maxAutoApproveAmount || requestedAmount);
      const interestRate = approvalRules.defaultInterestRate || 7.5;
      const maxTerm = approvalRules.maxLoanTerm || 60;

      return {
        decision: DecisionStatus.APPROVED,
        approvedAmount,
        approvedInterestRate: interestRate,
        approvedTerm: maxTerm,
        rationale: `Standard tier borrower - Auto-approved`,
      };
    }

    // Monitored tier - Conditional approval
    if (tier === RiskTier.MONITORED && canAutoApprove.canApprove) {
      const approvedAmount = Math.min(requestedAmount, approvalRules.maxAutoApproveAmount || requestedAmount);
      const interestRate = approvalRules.defaultInterestRate || 10.5;
      const maxTerm = approvalRules.maxLoanTerm || 48;

      return {
        decision: DecisionStatus.CONDITIONAL,
        approvedAmount,
        approvedInterestRate: interestRate,
        approvedTerm: maxTerm,
        conditions: [
          'Additional documentation may be required',
          'Regular monitoring of repayment behavior',
          'Co-signer may be recommended',
        ],
        rationale: `Monitored tier borrower - Conditional approval with enhanced monitoring`,
      };
    }

    // High-risk tier - Manual review required
    if (tier === RiskTier.HIGH_RISK) {
      return {
        decision: DecisionStatus.REFERRED,
        rationale: `High-risk tier borrower - Manual underwriting review required`,
        conditions: [
          'Manual review required',
          'May require co-signer',
          'May require collateral',
          'Additional documentation required',
        ],
      };
    }

    // Fallback - Refer for manual review
    return {
      decision: DecisionStatus.REFERRED,
      rationale: `Application requires manual review`,
    };
  }

  /**
   * Get tier-specific interest rate
   */
  async getTierInterestRate(
    tier: RiskTier,
    companyId: string,
    requestedAmount?: number,
  ): Promise<number> {
    return await this.riskTierService.getInterestRate(tier, companyId, requestedAmount);
  }

  /**
   * Get tier-specific maximum loan amount
   */
  async getTierMaxLoanAmount(tier: RiskTier, companyId: string): Promise<number | null> {
    return await this.riskTierService.getMaxLoanAmount(tier, companyId);
  }
}

