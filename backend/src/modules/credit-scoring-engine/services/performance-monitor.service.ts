import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PerformanceMetric } from '../entities/performance-metric.entity';

/**
 * Service for monitoring credit scoring performance metrics
 * Tracks p50, p95, p99 latencies and other performance indicators
 */
@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);

  // In-memory metrics for real-time tracking
  private readonly latencyMetrics: number[] = [];
  private readonly maxMetrics = 10000; // Keep last 10K metrics

  constructor(
    @InjectRepository(PerformanceMetric)
    private readonly metricRepository: Repository<PerformanceMetric>,
  ) {}

  /**
   * Record scoring latency
   */
  async recordLatency(
    endpoint: string,
    latencyMs: number,
    success: boolean,
    companyId?: string,
  ): Promise<void> {
    // Add to in-memory array for real-time calculations
    this.latencyMetrics.push(latencyMs);
    if (this.latencyMetrics.length > this.maxMetrics) {
      this.latencyMetrics.shift(); // Remove oldest
    }

    // Persist to database for historical analysis
    try {
      const metric = this.metricRepository.create({
        endpoint,
        latencyMs,
        success,
        companyId: companyId || 'default',
        timestamp: new Date(),
      });
      await this.metricRepository.save(metric);
    } catch (error) {
      this.logger.warn(`Failed to persist performance metric: ${error.message}`);
    }
  }

  /**
   * Calculate percentile from array
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get current latency percentiles
   */
  getLatencyPercentiles(): {
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    average: number;
    count: number;
  } {
    if (this.latencyMetrics.length === 0) {
      return {
        p50: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
        average: 0,
        count: 0,
      };
    }

    const p50 = this.calculatePercentile(this.latencyMetrics, 50);
    const p95 = this.calculatePercentile(this.latencyMetrics, 95);
    const p99 = this.calculatePercentile(this.latencyMetrics, 99);
    const min = Math.min(...this.latencyMetrics);
    const max = Math.max(...this.latencyMetrics);
    const average = this.latencyMetrics.reduce((a, b) => a + b, 0) / this.latencyMetrics.length;

    return {
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      min: Math.round(min),
      max: Math.round(max),
      average: Math.round(average),
      count: this.latencyMetrics.length,
    };
  }

  /**
   * Get historical latency percentiles from database
   */
  async getHistoricalLatencyPercentiles(
    endpoint: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<{
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    average: number;
    count: number;
  }> {
    const query = this.metricRepository
      .createQueryBuilder('metric')
      .where('metric.endpoint = :endpoint', { endpoint })
      .andWhere('metric.success = :success', { success: true });

    if (fromDate) {
      query.andWhere('metric.timestamp >= :fromDate', { fromDate });
    }
    if (toDate) {
      query.andWhere('metric.timestamp <= :toDate', { toDate });
    }

    const metrics = await query.orderBy('metric.latencyMs', 'ASC').getMany();

    if (metrics.length === 0) {
      return {
        p50: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
        average: 0,
        count: 0,
      };
    }

    const latencies = metrics.map((m) => m.latencyMs);
    const p50 = this.calculatePercentile(latencies, 50);
    const p95 = this.calculatePercentile(latencies, 95);
    const p99 = this.calculatePercentile(latencies, 99);
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const average = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    return {
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      min: Math.round(min),
      max: Math.round(max),
      average: Math.round(average),
      count: latencies.length,
    };
  }

  /**
   * Check if performance meets SLA (p95 < 2s)
   */
  isPerformanceWithinSLA(): boolean {
    const percentiles = this.getLatencyPercentiles();
    return percentiles.p95 < 2000; // 2 seconds
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(endpoint?: string): Promise<{
    current: {
      p50: number;
      p95: number;
      p99: number;
      meetsSLA: boolean;
    };
    historical?: {
      p50: number;
      p95: number;
      p99: number;
    };
    trends: {
      improving: boolean;
      degrading: boolean;
    };
  }> {
    const current = this.getLatencyPercentiles();
    const meetsSLA = current.p95 < 2000;

    let historical = undefined;
    if (endpoint) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      historical = await this.getHistoricalLatencyPercentiles(endpoint, thirtyDaysAgo);
    }

    const trends = {
      improving: historical ? current.p95 < historical.p95 : false,
      degrading: historical ? current.p95 > historical.p95 * 1.1 : false, // 10% degradation
    };

    return {
      current: {
        p50: current.p50,
        p95: current.p95,
        p99: current.p99,
        meetsSLA,
      },
      historical,
      trends,
    };
  }

  /**
   * Clean up old metrics (run periodically)
   */
  async cleanupOldMetrics(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.metricRepository.delete({
      timestamp: LessThan(cutoffDate),
    });

    this.logger.log(`Cleaned up ${result.affected || 0} old performance metrics`);
    return result.affected || 0;
  }
}

