import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Service for caching credit scoring data to improve performance
 * Implements intelligent caching strategy:
 * - Credit reports: 90 days TTL
 * - Feature calculations: 1 day TTL
 * - Model predictions: 1 hour TTL
 */
@Injectable()
export class ScoringCacheService {
  private readonly logger = new Logger(ScoringCacheService.name);

  // Cache TTL in milliseconds
  private readonly CACHE_TTL = {
    CREDIT_REPORT: 90 * 24 * 60 * 60 * 1000, // 90 days
    FEATURES: 24 * 60 * 60 * 1000, // 1 day
    PREDICTIONS: 60 * 60 * 1000, // 1 hour
    SCORE_RESULT: 60 * 60 * 1000, // 1 hour
  };

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Cache credit report
   */
  async cacheCreditReport(
    applicantId: string,
    companyId: string,
    report: any,
  ): Promise<void> {
    const key = this.getCreditReportKey(applicantId, companyId);
    try {
      await this.cacheManager.set(key, report, this.CACHE_TTL.CREDIT_REPORT);
      this.logger.debug(`Cached credit report for applicant ${applicantId}`);
    } catch (error) {
      this.logger.warn(`Failed to cache credit report: ${error.message}`);
    }
  }

  /**
   * Get cached credit report
   */
  async getCachedCreditReport(applicantId: string, companyId: string): Promise<any | null> {
    const key = this.getCreditReportKey(applicantId, companyId);
    try {
      const cached = await this.cacheManager.get(key);
      if (cached) {
        this.logger.debug(`Cache hit for credit report: ${applicantId}`);
        return cached;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Failed to get cached credit report: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache feature calculations
   */
  async cacheFeatures(
    applicantId: string,
    featureType: 'traditional' | 'alternative' | 'behavioral',
    features: any,
  ): Promise<void> {
    const key = this.getFeatureKey(applicantId, featureType);
    try {
      await this.cacheManager.set(key, features, this.CACHE_TTL.FEATURES);
      this.logger.debug(`Cached ${featureType} features for applicant ${applicantId}`);
    } catch (error) {
      this.logger.warn(`Failed to cache features: ${error.message}`);
    }
  }

  /**
   * Get cached features
   */
  async getCachedFeatures(
    applicantId: string,
    featureType: 'traditional' | 'alternative' | 'behavioral',
  ): Promise<any | null> {
    const key = this.getFeatureKey(applicantId, featureType);
    try {
      const cached = await this.cacheManager.get(key);
      if (cached) {
        this.logger.debug(`Cache hit for ${featureType} features: ${applicantId}`);
        return cached;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Failed to get cached features: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache model prediction
   */
  async cachePrediction(
    applicantId: string,
    modelVersion: string,
    prediction: any,
  ): Promise<void> {
    const key = this.getPredictionKey(applicantId, modelVersion);
    try {
      await this.cacheManager.set(key, prediction, this.CACHE_TTL.PREDICTIONS);
      this.logger.debug(`Cached prediction for applicant ${applicantId}`);
    } catch (error) {
      this.logger.warn(`Failed to cache prediction: ${error.message}`);
    }
  }

  /**
   * Get cached prediction
   */
  async getCachedPrediction(applicantId: string, modelVersion: string): Promise<any | null> {
    const key = this.getPredictionKey(applicantId, modelVersion);
    try {
      const cached = await this.cacheManager.get(key);
      if (cached) {
        this.logger.debug(`Cache hit for prediction: ${applicantId}`);
        return cached;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Failed to get cached prediction: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache complete score result
   */
  async cacheScoreResult(applicantId: string, companyId: string, result: any): Promise<void> {
    const key = this.getScoreResultKey(applicantId, companyId);
    try {
      await this.cacheManager.set(key, result, this.CACHE_TTL.SCORE_RESULT);
      this.logger.debug(`Cached score result for applicant ${applicantId}`);
    } catch (error) {
      this.logger.warn(`Failed to cache score result: ${error.message}`);
    }
  }

  /**
   * Get cached score result
   */
  async getCachedScoreResult(applicantId: string, companyId: string): Promise<any | null> {
    const key = this.getScoreResultKey(applicantId, companyId);
    try {
      const cached = await this.cacheManager.get(key);
      if (cached) {
        this.logger.debug(`Cache hit for score result: ${applicantId}`);
        return cached;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Failed to get cached score result: ${error.message}`);
      return null;
    }
  }

  /**
   * Invalidate cache for applicant
   */
  async invalidateApplicantCache(applicantId: string): Promise<void> {
    const patterns = [
      this.getCreditReportKey(applicantId, '*'),
      this.getFeatureKey(applicantId, 'traditional'),
      this.getFeatureKey(applicantId, 'alternative'),
      this.getFeatureKey(applicantId, 'behavioral'),
      this.getScoreResultKey(applicantId, '*'),
    ];

    for (const pattern of patterns) {
      try {
        // Note: cache-manager doesn't support pattern deletion by default
        // In production, use Redis directly for pattern-based deletion
        await this.cacheManager.del(pattern);
      } catch (error) {
        this.logger.warn(`Failed to invalidate cache: ${error.message}`);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    hitRate: number;
    missRate: number;
    totalRequests: number;
  }> {
    // In production, implement actual cache statistics tracking
    // For now, return placeholder
    return {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
    };
  }

  // Private helper methods for cache keys

  private getCreditReportKey(applicantId: string, companyId: string): string {
    return `credit_report:${companyId}:${applicantId}`;
  }

  private getFeatureKey(applicantId: string, featureType: string): string {
    return `features:${applicantId}:${featureType}`;
  }

  private getPredictionKey(applicantId: string, modelVersion: string): string {
    return `prediction:${modelVersion}:${applicantId}`;
  }

  private getScoreResultKey(applicantId: string, companyId: string): string {
    return `score_result:${companyId}:${applicantId}`;
  }
}

