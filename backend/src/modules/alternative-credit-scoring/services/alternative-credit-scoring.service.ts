import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlternativeCreditScore, DataSource } from '../entities/alternative-credit-score.entity';
import {
  CalculateAlternativeScoreDto,
  AlternativeCreditScore as AlternativeCreditScoreDto,
  DataSourceVerification,
} from '../dto/alternative-credit-scoring.dto';

@Injectable()
export class AlternativeCreditScoringService {
  private readonly logger = new Logger(AlternativeCreditScoringService.name);

  constructor(
    @InjectRepository(AlternativeCreditScore)
    private readonly scoreRepository: Repository<AlternativeCreditScore>,
  ) {}

  /**
   * Calculate alternative credit score
   */
  async calculateAlternativeScore(
    dto: CalculateAlternativeScoreDto,
    companyId: string,
  ): Promise<AlternativeCreditScoreDto> {
    this.logger.log(`Calculating alternative credit score for customer ${dto.customerId}`);

    const scoreBreakdown: any = {
      transactionHistory: 0,
      utilityPayments: 0,
      rentalPayments: 0,
      cashFlow: 0,
      mobilePhone: 0,
      other: 0,
    };

    let totalScore = 0;
    let totalWeight = 0;
    const riskFactors: string[] = [];
    const positiveFactors: string[] = [];
    const recommendations: string[] = [];

    // Calculate score from each data source
    for (const source of dto.dataSources) {
      let sourceScore = 0;
      let weight = 0;

      switch (source) {
        case DataSource.TRANSACTION_HISTORY:
          if (dto.transactionData) {
            const result = this.calculateTransactionScore(dto.transactionData);
            sourceScore = result.score;
            weight = 30; // 30% weight
            scoreBreakdown.transactionHistory = sourceScore;
            riskFactors.push(...result.riskFactors);
            positiveFactors.push(...result.positiveFactors);
          }
          break;

        case DataSource.UTILITY_PAYMENTS:
          if (dto.utilityPayments) {
            const result = this.calculateUtilityScore(dto.utilityPayments);
            sourceScore = result.score;
            weight = 20; // 20% weight
            scoreBreakdown.utilityPayments = sourceScore;
            riskFactors.push(...result.riskFactors);
            positiveFactors.push(...result.positiveFactors);
          }
          break;

        case DataSource.RENTAL_PAYMENTS:
          if (dto.rentalPayments) {
            const result = this.calculateRentalScore(dto.rentalPayments);
            sourceScore = result.score;
            weight = 25; // 25% weight
            scoreBreakdown.rentalPayments = sourceScore;
            riskFactors.push(...result.riskFactors);
            positiveFactors.push(...result.positiveFactors);
          }
          break;

        case DataSource.CASH_FLOW:
          if (dto.cashFlow) {
            const result = this.calculateCashFlowScore(dto.cashFlow);
            sourceScore = result.score;
            weight = 15; // 15% weight
            scoreBreakdown.cashFlow = sourceScore;
            riskFactors.push(...result.riskFactors);
            positiveFactors.push(...result.positiveFactors);
          }
          break;

        case DataSource.MOBILE_PHONE:
          if (dto.mobilePhone) {
            const result = this.calculateMobilePhoneScore(dto.mobilePhone);
            sourceScore = result.score;
            weight = 10; // 10% weight
            scoreBreakdown.mobilePhone = sourceScore;
            riskFactors.push(...result.riskFactors);
            positiveFactors.push(...result.positiveFactors);
          }
          break;
      }

      totalScore += sourceScore * weight;
      totalWeight += weight;
    }

    // Calculate weighted average
    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

    // Calculate confidence level based on data sources
    const confidenceLevel = this.calculateConfidenceLevel(dto.dataSources, dto);

    // Generate recommendations
    if (finalScore < 600) {
      recommendations.push('Improve payment history', 'Build savings', 'Reduce debt');
    } else if (finalScore < 700) {
      recommendations.push('Maintain on-time payments', 'Increase savings rate');
    } else {
      recommendations.push('Maintain excellent payment history');
    }

    // Save score
    const score = this.scoreRepository.create({
      companyId,
      customerId: dto.customerId,
      score: finalScore,
      scoreRange: { min: 300, max: 850 },
      dataSources: dto.dataSources,
      scoreBreakdown,
      confidenceLevel,
      riskFactors: [...new Set(riskFactors)],
      positiveFactors: [...new Set(positiveFactors)],
      recommendations,
      rawData: {
        transactionData: dto.transactionData,
        utilityPayments: dto.utilityPayments,
        rentalPayments: dto.rentalPayments,
        cashFlow: dto.cashFlow,
        mobilePhone: dto.mobilePhone,
      },
    });

    const saved = await this.scoreRepository.save(score);

    return this.mapToDto(saved);
  }

  /**
   * Get alternative credit score
   */
  async getAlternativeScore(
    customerId: string,
    companyId: string,
  ): Promise<AlternativeCreditScoreDto | null> {
    const score = await this.scoreRepository.findOne({
      where: { customerId, companyId },
      order: { calculatedAt: 'DESC' },
    });

    if (!score) {
      return null;
    }

    return this.mapToDto(score);
  }

  // Private helper methods

  private calculateTransactionScore(data: any): {
    score: number;
    riskFactors: string[];
    positiveFactors: string[];
  } {
    let score = 600; // Base score
    const riskFactors: string[] = [];
    const positiveFactors: string[] = [];

    // Income stability
    if (data.averageMonthlyIncome > 0) {
      if (data.averageMonthlyIncome > 50000) {
        score += 50;
        positiveFactors.push('High income');
      } else if (data.averageMonthlyIncome > 30000) {
        score += 30;
        positiveFactors.push('Moderate income');
      }
    } else {
      riskFactors.push('No income data');
    }

    // Savings rate
    if (data.savingsRate > 0.2) {
      score += 40;
      positiveFactors.push('High savings rate');
    } else if (data.savingsRate > 0.1) {
      score += 20;
      positiveFactors.push('Moderate savings rate');
    } else if (data.savingsRate < 0) {
      score -= 30;
      riskFactors.push('Negative savings rate');
    }

    // On-time payments
    const onTimeRate = data.onTimePayments / (data.transactionCount || 1);
    if (onTimeRate > 0.95) {
      score += 50;
      positiveFactors.push('Excellent payment history');
    } else if (onTimeRate > 0.9) {
      score += 30;
      positiveFactors.push('Good payment history');
    } else if (onTimeRate < 0.8) {
      score -= 40;
      riskFactors.push('Poor payment history');
    }

    // Transaction frequency
    if (data.transactionCount > 50) {
      score += 20;
      positiveFactors.push('Active account');
    }

    return {
      score: Math.max(300, Math.min(850, score)),
      riskFactors,
      positiveFactors,
    };
  }

  private calculateUtilityScore(data: any): {
    score: number;
    riskFactors: string[];
    positiveFactors: string[];
  } {
    let score = 600;
    const riskFactors: string[] = [];
    const positiveFactors: string[] = [];

    const utilities = ['electricity', 'water', 'internet'];
    let totalOnTime = 0;
    let totalLate = 0;
    let totalMissed = 0;

    for (const utility of utilities) {
      if (data[utility]) {
        totalOnTime += data[utility].onTime || 0;
        totalLate += data[utility].late || 0;
        totalMissed += data[utility].missed || 0;
      }
    }

    const total = totalOnTime + totalLate + totalMissed;
    if (total > 0) {
      const onTimeRate = totalOnTime / total;
      if (onTimeRate > 0.95) {
        score += 50;
        positiveFactors.push('Excellent utility payment history');
      } else if (onTimeRate > 0.9) {
        score += 30;
        positiveFactors.push('Good utility payment history');
      } else if (onTimeRate < 0.8) {
        score -= 40;
        riskFactors.push('Poor utility payment history');
      }

      if (totalMissed > 0) {
        score -= 30;
        riskFactors.push('Missed utility payments');
      }
    }

    return {
      score: Math.max(300, Math.min(850, score)),
      riskFactors,
      positiveFactors,
    };
  }

  private calculateRentalScore(data: any): {
    score: number;
    riskFactors: string[];
    positiveFactors: string[];
  } {
    let score = 600;
    const riskFactors: string[] = [];
    const positiveFactors: string[] = [];

    const total = data.onTimePayments + data.latePayments + data.missedPayments;
    if (total > 0) {
      const onTimeRate = data.onTimePayments / total;
      if (onTimeRate > 0.95) {
        score += 60;
        positiveFactors.push('Excellent rental payment history');
      } else if (onTimeRate > 0.9) {
        score += 40;
        positiveFactors.push('Good rental payment history');
      } else if (onTimeRate < 0.8) {
        score -= 50;
        riskFactors.push('Poor rental payment history');
      }

      if (data.missedPayments > 0) {
        score -= 40;
        riskFactors.push('Missed rental payments');
      }
    }

    return {
      score: Math.max(300, Math.min(850, score)),
      riskFactors,
      positiveFactors,
    };
  }

  private calculateCashFlowScore(data: any): {
    score: number;
    riskFactors: string[];
    positiveFactors: string[];
  } {
    let score = 600;
    const riskFactors: string[] = [];
    const positiveFactors: string[] = [];

    // Income stability
    if (data.incomeStability > 80) {
      score += 40;
      positiveFactors.push('Stable income');
    } else if (data.incomeStability < 50) {
      score -= 30;
      riskFactors.push('Unstable income');
    }

    // Expense stability
    if (data.expenseStability > 80) {
      score += 30;
      positiveFactors.push('Stable expenses');
    } else if (data.expenseStability < 50) {
      score -= 20;
      riskFactors.push('Unstable expenses');
    }

    // Savings pattern
    if (data.savingsPattern === 'REGULAR') {
      score += 30;
      positiveFactors.push('Regular savings');
    } else if (data.savingsPattern === 'IRREGULAR') {
      score -= 20;
      riskFactors.push('Irregular savings');
    }

    return {
      score: Math.max(300, Math.min(850, score)),
      riskFactors,
      positiveFactors,
    };
  }

  private calculateMobilePhoneScore(data: any): {
    score: number;
    riskFactors: string[];
    positiveFactors: string[];
  } {
    let score = 600;
    const riskFactors: string[] = [];
    const positiveFactors: string[] = [];

    // Account age
    if (data.accountAge > 24) {
      score += 30;
      positiveFactors.push('Long account history');
    } else if (data.accountAge < 6) {
      score -= 20;
      riskFactors.push('New account');
    }

    // Top-up frequency (indicates financial stability)
    if (data.topUpFrequency > 4) {
      score += 20;
      positiveFactors.push('Regular top-ups');
    }

    // Payment method
    if (data.paymentMethod === 'AUTO_PAY' || data.paymentMethod === 'CREDIT_CARD') {
      score += 20;
      positiveFactors.push('Automated payments');
    }

    return {
      score: Math.max(300, Math.min(850, score)),
      riskFactors,
      positiveFactors,
    };
  }

  private calculateConfidenceLevel(
    dataSources: DataSource[],
    dto: CalculateAlternativeScoreDto,
  ): number {
    let confidence = 0;
    let totalWeight = 0;

    // Each data source adds to confidence
    for (const source of dataSources) {
      let hasData = false;
      let weight = 0;

      switch (source) {
        case DataSource.TRANSACTION_HISTORY:
          hasData = !!dto.transactionData;
          weight = 0.3;
          break;
        case DataSource.UTILITY_PAYMENTS:
          hasData = !!dto.utilityPayments;
          weight = 0.2;
          break;
        case DataSource.RENTAL_PAYMENTS:
          hasData = !!dto.rentalPayments;
          weight = 0.25;
          break;
        case DataSource.CASH_FLOW:
          hasData = !!dto.cashFlow;
          weight = 0.15;
          break;
        case DataSource.MOBILE_PHONE:
          hasData = !!dto.mobilePhone;
          weight = 0.1;
          break;
      }

      if (hasData) {
        confidence += weight;
      }
      totalWeight += weight;
    }

    return totalWeight > 0 ? confidence / totalWeight : 0;
  }

  private mapToDto(score: AlternativeCreditScore): AlternativeCreditScoreDto {
    return {
      id: score.id,
      customerId: score.customerId,
      score: score.score,
      scoreRange: score.scoreRange,
      dataSources: score.dataSources,
      scoreBreakdown: score.scoreBreakdown,
      confidenceLevel: Number(score.confidenceLevel),
      riskFactors: score.riskFactors,
      positiveFactors: score.positiveFactors,
      recommendations: score.recommendations,
      calculatedAt: score.calculatedAt.toISOString(),
    };
  }
}

