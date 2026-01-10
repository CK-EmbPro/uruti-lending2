import { Injectable, Logger } from '@nestjs/common';
import { LoanRestructure } from '../entities/loan-restructure.entity';
import { LoanRepaymentSchedule } from '../../loan/entities/loan-repayment-schedule.entity';

export interface ScheduleImpactAnalysis {
  oldSchedule: {
    totalPayments: number;
    totalInterest: number;
    totalPrincipal: number;
    totalCost: number;
    numberOfPayments: number;
    averagePayment: number;
  };
  newSchedule: {
    totalPayments: number;
    totalInterest: number;
    totalPrincipal: number;
    totalCost: number;
    numberOfPayments: number;
    averagePayment: number;
  };
  impact: {
    interestDifference: number;
    totalCostDifference: number;
    paymentDifference: number;
    extensionMonths: number;
    percentageIncrease: number;
    interestIncreasePercentage: number;
  };
}

@Injectable()
export class RestructureImpactAnalysisService {
  private readonly logger = new Logger(RestructureImpactAnalysisService.name);

  /**
   * Analyze impact of restructure on repayment schedule
   */
  async analyzeImpact(
    restructure: LoanRestructure,
    oldSchedule: LoanRepaymentSchedule[],
    newSchedule: LoanRepaymentSchedule[],
  ): Promise<ScheduleImpactAnalysis> {
    // Calculate old schedule totals
    const oldTotals = this.calculateScheduleTotals(oldSchedule);

    // Calculate new schedule totals
    const newTotals = this.calculateScheduleTotals(newSchedule);

    // Calculate impact
    const interestDifference = newTotals.totalInterest - oldTotals.totalInterest;
    const totalCostDifference = newTotals.totalCost - oldTotals.totalCost;
    const paymentDifference = newTotals.averagePayment - oldTotals.averagePayment;
    const extensionMonths = (restructure.newRepaymentPeriodInMonths || 0) - restructure.oldTenure;
    const percentageIncrease = restructure.oldTenure > 0
      ? ((restructure.newRepaymentPeriodInMonths || 0) - restructure.oldTenure) / restructure.oldTenure * 100
      : 0;
    const interestIncreasePercentage = oldTotals.totalInterest > 0
      ? (interestDifference / oldTotals.totalInterest) * 100
      : 0;

    const analysis: ScheduleImpactAnalysis = {
      oldSchedule: oldTotals,
      newSchedule: newTotals,
      impact: {
        interestDifference,
        totalCostDifference,
        paymentDifference,
        extensionMonths,
        percentageIncrease,
        interestIncreasePercentage,
      },
    };

    this.logger.log(
      `Impact analysis for restructure ${restructure.id}: ` +
      `Interest difference: ${interestDifference}, ` +
      `Total cost difference: ${totalCostDifference}, ` +
      `Extension: ${extensionMonths} months (${percentageIncrease.toFixed(1)}%)`,
    );

    return analysis;
  }

  /**
   * Calculate totals from a repayment schedule
   */
  private calculateScheduleTotals(
    schedule: LoanRepaymentSchedule[],
  ): {
    totalPayments: number;
    totalInterest: number;
    totalPrincipal: number;
    totalCost: number;
    numberOfPayments: number;
    averagePayment: number;
  } {
    const totalPayments = schedule.reduce((sum, entry) => sum + Number(entry.totalPayment || 0), 0);
    const totalInterest = schedule.reduce((sum, entry) => sum + Number(entry.interestAmount || 0), 0);
    const totalPrincipal = schedule.reduce((sum, entry) => sum + Number(entry.principalAmount || 0), 0);
    const numberOfPayments = schedule.length;
    const averagePayment = numberOfPayments > 0 ? totalPayments / numberOfPayments : 0;
    const totalCost = totalPayments; // Total cost is sum of all payments

    return {
      totalPayments,
      totalInterest,
      totalPrincipal,
      totalCost,
      numberOfPayments,
      averagePayment,
    };
  }

  /**
   * Generate human-readable impact summary
   */
  generateImpactSummary(analysis: ScheduleImpactAnalysis): string {
    const parts: string[] = [];

    parts.push(`**Old Schedule:**`);
    parts.push(`- Total Payments: ${analysis.oldSchedule.totalPayments.toLocaleString()}`);
    parts.push(`- Total Interest: ${analysis.oldSchedule.totalInterest.toLocaleString()}`);
    parts.push(`- Number of Payments: ${analysis.oldSchedule.numberOfPayments}`);
    parts.push(`- Average Payment: ${analysis.oldSchedule.averagePayment.toLocaleString()}`);

    parts.push(`\n**New Schedule:**`);
    parts.push(`- Total Payments: ${analysis.newSchedule.totalPayments.toLocaleString()}`);
    parts.push(`- Total Interest: ${analysis.newSchedule.totalInterest.toLocaleString()}`);
    parts.push(`- Number of Payments: ${analysis.newSchedule.numberOfPayments}`);
    parts.push(`- Average Payment: ${analysis.newSchedule.averagePayment.toLocaleString()}`);

    parts.push(`\n**Impact:**`);
    parts.push(`- Interest Difference: ${analysis.impact.interestDifference >= 0 ? '+' : ''}${analysis.impact.interestDifference.toLocaleString()} (${analysis.impact.interestIncreasePercentage >= 0 ? '+' : ''}${analysis.impact.interestIncreasePercentage.toFixed(1)}%)`);
    parts.push(`- Total Cost Difference: ${analysis.impact.totalCostDifference >= 0 ? '+' : ''}${analysis.impact.totalCostDifference.toLocaleString()}`);
    parts.push(`- Payment Difference: ${analysis.impact.paymentDifference >= 0 ? '+' : ''}${analysis.impact.paymentDifference.toLocaleString()}`);
    parts.push(`- Extension: ${analysis.impact.extensionMonths} months (${analysis.impact.percentageIncrease >= 0 ? '+' : ''}${analysis.impact.percentageIncrease.toFixed(1)}%)`);

    return parts.join('\n');
  }
}

