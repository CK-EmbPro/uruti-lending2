import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PerformanceMetric, MetricType } from '../entities/performance-metric.entity';
import { AlertRule, AlertSeverity } from '../entities/alert-rule.entity';
import {
  GetPerformanceMetricsDto,
  PerformanceMetricsResult,
  CreateAlertRuleDto,
  SystemHealth,
} from '../dto/performance-monitoring.dto';

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);

  constructor(
    @InjectRepository(PerformanceMetric)
    private readonly metricRepository: Repository<PerformanceMetric>,
    @InjectRepository(AlertRule)
    private readonly alertRuleRepository: Repository<AlertRule>,
  ) {}

  /**
   * Record performance metric
   */
  async recordMetric(
    metricType: MetricType,
    value: number,
    companyId: string,
    endpoint?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const metric = this.metricRepository.create({
      companyId,
      metricType,
      value,
      endpoint,
      metadata,
    });

    await this.metricRepository.save(metric);

    // Check alert rules
    await this.checkAlertRules(metricType, value, companyId, endpoint);
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    dto: GetPerformanceMetricsDto,
    companyId: string,
  ): Promise<PerformanceMetricsResult> {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    const where: any = {
      companyId,
      timestamp: Between(startDate, endDate) as any,
    };

    if (dto.metricType) {
      where.metricType = dto.metricType;
    }

    if (dto.endpoint) {
      where.endpoint = dto.endpoint;
    }

    const metrics = await this.metricRepository.find({
      where,
      order: { timestamp: 'ASC' },
    });

    // Calculate summary statistics
    const values = metrics.map((m) => Number(m.value));
    const summary = this.calculateSummary(values);

    // Get active alerts
    const alerts = await this.getActiveAlerts(companyId);

    return {
      metrics: metrics.map((m) => ({
        timestamp: m.timestamp.toISOString(),
        type: m.metricType,
        value: Number(m.value),
        endpoint: m.endpoint,
        metadata: m.metadata,
      })),
      summary,
      alerts,
    };
  }

  /**
   * Create alert rule
   */
  async createAlertRule(
    dto: CreateAlertRuleDto,
    companyId: string,
  ): Promise<AlertRule> {
    const rule = this.alertRuleRepository.create({
      companyId,
      name: dto.name,
      metricType: dto.metricType,
      threshold: dto.threshold,
      operator: dto.operator,
      severity: dto.severity,
      endpoint: dto.endpoint,
      isActive: dto.isActive !== false,
    });

    return await this.alertRuleRepository.save(rule);
  }

  /**
   * Get system health
   */
  async getSystemHealth(companyId: string): Promise<SystemHealth> {
    // Get recent metrics
    const recentMetrics = await this.metricRepository.find({
      where: {
        companyId,
        timestamp: Between(
          new Date(Date.now() - 5 * 60 * 1000),
          new Date(),
        ) as any,
      },
      order: { timestamp: 'DESC' },
      take: 100,
    });

    // Calculate component health
    const apiMetrics = recentMetrics.filter((m) => m.metricType === MetricType.API_RESPONSE_TIME);
    const dbMetrics = recentMetrics.filter((m) => m.metricType === MetricType.DATABASE_QUERY_TIME);
    const cacheMetrics = recentMetrics.filter((m) => m.metricType === MetricType.CACHE_HIT_RATE);

    const apiAvgResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + Number(m.value), 0) / apiMetrics.length
      : 0;

    const dbAvgResponseTime = dbMetrics.length > 0
      ? dbMetrics.reduce((sum, m) => sum + Number(m.value), 0) / dbMetrics.length
      : 0;

    const cacheHitRate = cacheMetrics.length > 0
      ? cacheMetrics.reduce((sum, m) => sum + Number(m.value), 0) / cacheMetrics.length
      : 95;

    // Determine component status
    const apiStatus = apiAvgResponseTime < 500 ? 'HEALTHY' : apiAvgResponseTime < 1000 ? 'DEGRADED' : 'UNHEALTHY';
    const dbStatus = dbAvgResponseTime < 100 ? 'HEALTHY' : dbAvgResponseTime < 500 ? 'DEGRADED' : 'UNHEALTHY';
    const cacheStatus = cacheHitRate > 80 ? 'HEALTHY' : cacheHitRate > 60 ? 'DEGRADED' : 'UNHEALTHY';

    // Calculate overall health score
    let healthScore = 100;
    if (apiAvgResponseTime > 500) healthScore -= 10;
    if (apiAvgResponseTime > 1000) healthScore -= 20;
    if (dbAvgResponseTime > 100) healthScore -= 10;
    if (dbAvgResponseTime > 500) healthScore -= 20;
    if (cacheHitRate < 80) healthScore -= 10;
    if (cacheHitRate < 60) healthScore -= 20;

    healthScore = Math.max(0, healthScore);

    // Get active alerts
    const activeAlerts = await this.alertRuleRepository.count({
      where: {
        companyId,
        isActive: true,
        lastTriggeredAt: Between(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
        ) as any,
      },
    });

    const overallStatus = healthScore >= 90 ? 'HEALTHY' : healthScore >= 70 ? 'DEGRADED' : 'UNHEALTHY';

    return {
      status: overallStatus,
      healthScore: Math.round(healthScore),
      components: {
        database: {
          status: dbStatus,
          responseTime: Math.round(dbAvgResponseTime * 100) / 100,
        },
        api: {
          status: apiStatus,
          averageResponseTime: Math.round(apiAvgResponseTime * 100) / 100,
        },
        cache: {
          status: cacheStatus,
          hitRate: Math.round(cacheHitRate * 100) / 100,
        },
        storage: {
          status: 'HEALTHY', // Would check actual storage
          usage: 45, // Percentage
        },
      },
      activeAlerts,
      uptime: 99.9, // Would calculate from actual uptime data
    };
  }

  // Private helper methods

  private async checkAlertRules(
    metricType: MetricType,
    value: number,
    companyId: string,
    endpoint?: string,
  ): Promise<void> {
    const rules = await this.alertRuleRepository.find({
      where: {
        companyId,
        metricType,
        isActive: true,
      },
    });

    for (const rule of rules) {
      // Check endpoint filter
      if (rule.endpoint && rule.endpoint !== endpoint) {
        continue;
      }

      // Check threshold
      let shouldTrigger = false;
      switch (rule.operator) {
        case '>':
          shouldTrigger = value > rule.threshold;
          break;
        case '<':
          shouldTrigger = value < rule.threshold;
          break;
        case '>=':
          shouldTrigger = value >= rule.threshold;
          break;
        case '<=':
          shouldTrigger = value <= rule.threshold;
          break;
        case '==':
          shouldTrigger = value === rule.threshold;
          break;
      }

      if (shouldTrigger) {
        rule.triggerCount++;
        rule.lastTriggeredAt = new Date();
        await this.alertRuleRepository.save(rule);

        this.logger.warn(
          `Alert triggered: ${rule.name} - ${metricType} ${rule.operator} ${rule.threshold} (value: ${value})`,
        );

        // In production, would send notification
      }
    }
  }

  private async getActiveAlerts(companyId: string): Promise<Array<{
    id: string;
    severity: AlertSeverity;
    message: string;
    timestamp: string;
    resolved: boolean;
  }>> {
    const rules = await this.alertRuleRepository.find({
      where: {
        companyId,
        isActive: true,
        lastTriggeredAt: Between(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
        ) as any,
      },
      order: { lastTriggeredAt: 'DESC' },
      take: 20,
    });

    return rules.map((rule) => ({
      id: rule.id,
      severity: rule.severity,
      message: `${rule.name}: ${rule.metricType} ${rule.operator} ${rule.threshold}`,
      timestamp: rule.lastTriggeredAt?.toISOString() || rule.createdAt.toISOString(),
      resolved: false, // Would check if resolved
    }));
  }

  private calculateSummary(values: number[]): {
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
    count: number;
  } {
    if (values.length === 0) {
      return { average: 0, min: 0, max: 0, p95: 0, p99: 0, count: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const average = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      average: Math.round(average * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      p99: Math.round(p99 * 100) / 100,
      count: values.length,
    };
  }
}

