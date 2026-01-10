import { Injectable } from '@nestjs/common';
import { LoanPartnerService } from '../loan-partner.service';
import { Loan } from '../../loan/entities/loan.entity';
import { RepaymentScheduleType } from '../entities/loan-partner.entity';

/**
 * Service for calculating partner shares in co-lending scenarios
 */
@Injectable()
export class PartnerShareCalculationService {
  constructor(private readonly loanPartnerService: LoanPartnerService) {}

  /**
   * Calculate partner share for disbursement
   */
  async calculateDisbursementShare(
    loan: Loan,
    disbursedAmount: number,
  ): Promise<{
    partnerShare: number;
    companyShare: number;
  }> {
    if (!loan.loanPartnerId) {
      return {
        partnerShare: 0,
        companyShare: disbursedAmount,
      };
    }

    const partnerSharePercentage = loan.loanPartnerSharePercentage || 0;
    const partnerShare = (disbursedAmount * partnerSharePercentage) / 100;
    const companyShare = disbursedAmount - partnerShare;

    return {
      partnerShare,
      companyShare,
    };
  }

  /**
   * Calculate partner share for repayment based on repayment schedule type
   */
  async calculateRepaymentShare(
    loan: Loan,
    paidAmount: number,
    demandType?: string,
  ): Promise<{
    partnerShare: number;
    companyShare: number;
  }> {
    if (!loan.loanPartnerId) {
      return {
        partnerShare: 0,
        companyShare: paidAmount,
      };
    }

    const scheduleType = loan.loanPartnerRepaymentScheduleType;

    if (scheduleType === RepaymentScheduleType.EMI_PMT_BASED) {
      // EMI (PMT) based: Use payment ratio
      const paymentRatio = loan.loanPartnerPaymentRatio || 0;
      const partnerShare = (paidAmount * paymentRatio) / 100;
      const companyShare = paidAmount - partnerShare;

      return {
        partnerShare,
        companyShare,
      };
    } else if (
      scheduleType === RepaymentScheduleType.COLLECTION_AT_PARTNER_PERCENTAGE
    ) {
      // Collection at partner's percentage: Use share percentage
      const sharePercentage = loan.loanPartnerSharePercentage || 0;
      const partnerShare = (paidAmount * sharePercentage) / 100;
      const companyShare = paidAmount - partnerShare;

      return {
        partnerShare,
        companyShare,
      };
    } else if (
      scheduleType === RepaymentScheduleType.POS_REDUCTION_PLUS_INTEREST
    ) {
      // POS reduction plus interest at partner ROI
      if (demandType === 'Interest') {
        // For interest: Use payment ratio
        const paymentRatio = loan.loanPartnerPaymentRatio || 0;
        const partnerShare = (paidAmount * paymentRatio) / 100;
        const companyShare = paidAmount - partnerShare;

        return {
          partnerShare,
          companyShare,
        };
      } else if (demandType === 'Principal') {
        // For principal: Use share percentage
        const sharePercentage = loan.loanPartnerSharePercentage || 0;
        const partnerShare = (paidAmount * sharePercentage) / 100;
        const companyShare = paidAmount - partnerShare;

        return {
          partnerShare,
          companyShare,
        };
      }
    }

    // Default: Use share percentage
    const sharePercentage = loan.loanPartnerSharePercentage || 0;
    const partnerShare = (paidAmount * sharePercentage) / 100;
    const companyShare = paidAmount - partnerShare;

    return {
      partnerShare,
      companyShare,
    };
  }

  /**
   * Calculate partner share for interest
   */
  async calculateInterestShare(
    loan: Loan,
    interestAmount: number,
  ): Promise<{
    partnerShare: number;
    companyShare: number;
  }> {
    if (!loan.loanPartnerId) {
      return {
        partnerShare: 0,
        companyShare: interestAmount,
      };
    }

    // Get partner share percentage for interest
    const sharePercentage =
      await this.loanPartnerService.getPartnerSharePercentage(
        loan.loanPartnerId,
        'Interest',
      );

    const partnerShare = (interestAmount * sharePercentage) / 100;
    const companyShare = interestAmount - partnerShare;

    return {
      partnerShare,
      companyShare,
    };
  }

  /**
   * Calculate partner share for principal
   */
  async calculatePrincipalShare(
    loan: Loan,
    principalAmount: number,
  ): Promise<{
    partnerShare: number;
    companyShare: number;
  }> {
    if (!loan.loanPartnerId) {
      return {
        partnerShare: 0,
        companyShare: principalAmount,
      };
    }

    // Get partner share percentage for principal
    const sharePercentage =
      await this.loanPartnerService.getPartnerSharePercentage(
        loan.loanPartnerId,
        'Principal',
      );

    const partnerShare = (principalAmount * sharePercentage) / 100;
    const companyShare = principalAmount - partnerShare;

    return {
      partnerShare,
      companyShare,
    };
  }

  /**
   * Calculate partner share for penalty
   */
  async calculatePenaltyShare(
    loan: Loan,
    penaltyAmount: number,
  ): Promise<{
    partnerShare: number;
    companyShare: number;
  }> {
    if (!loan.loanPartnerId) {
      return {
        partnerShare: 0,
        companyShare: penaltyAmount,
      };
    }

    // Get partner share percentage for penalty
    const sharePercentage =
      await this.loanPartnerService.getPartnerSharePercentage(
        loan.loanPartnerId,
        'Penalty',
      );

    const partnerShare = (penaltyAmount * sharePercentage) / 100;
    const companyShare = penaltyAmount - partnerShare;

    return {
      partnerShare,
      companyShare,
    };
  }

  /**
   * Calculate overall partner share for a payment
   */
  async calculateOverallPartnerShare(
    loan: Loan,
    paidAmount: number,
  ): Promise<number> {
    if (!loan.loanPartnerId) {
      return 0;
    }

    const scheduleType = loan.loanPartnerRepaymentScheduleType;

    if (scheduleType === RepaymentScheduleType.EMI_PMT_BASED) {
      const paymentRatio = loan.loanPartnerPaymentRatio || 0;
      return (paidAmount * paymentRatio) / 100;
    } else if (
      scheduleType === RepaymentScheduleType.COLLECTION_AT_PARTNER_PERCENTAGE
    ) {
      const paymentRatio = loan.loanPartnerPaymentRatio || 0;
      return (paidAmount * paymentRatio) / 100;
    } else if (
      scheduleType === RepaymentScheduleType.POS_REDUCTION_PLUS_INTEREST
    ) {
      const sharePercentage = loan.loanPartnerSharePercentage || 0;
      return (paidAmount * sharePercentage) / 100;
    }

    // Default
    const sharePercentage = loan.loanPartnerSharePercentage || 0;
    return (paidAmount * sharePercentage) / 100;
  }
}

