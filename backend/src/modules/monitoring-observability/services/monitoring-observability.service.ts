import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Metric } from '../entities/metric.entity';
import { AlertRule } from '../entities/alert-rule.entity';
import { Alert } from '../entities/alert.entity';
import {
  CreateMetricDto,
  MetricType,
  AlertSeverity,
  CreateAlertRuleDto,
} from '../dto/monitoring-observability.dto';

@Injectable()
export class MonitoringObservabilityService {
  private readonly logger = new Logger(MonitoringObservabilityService.name);

  constructor(
    @InjectRepository(Metric)
    private metricRepository: Repository<Metric>,
    @InjectRepository(AlertRule)
    private alertRuleRepository: Repository<AlertRule>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {
    // Start monitoring loop
    setInterval(() => this.checkAlerts(), 60000); // Every minute
  }

  async recordMetric(createDto: CreateMetricDto): Promise<Metric> {
    const metric = this.metricRepository.create({
      ...createDto,
      timestamp: new Date(),
    });

    return this.metricRepository.save(metric);
  }

  async getMetrics(
    name: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Metric[]> {
    return this.metricRepository.find({
      where: {
        name,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });
  }

  async createAlertRule(createDto: CreateAlertRuleDto): Promise<AlertRule> {
    const rule = this.alertRuleRepository.create(createDto);
    return this.alertRuleRepository.save(rule);
  }

  async findAllAlertRules(isActive?: boolean): Promise<AlertRule[]> {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.alertRuleRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getAlerts(
    severity?: AlertSeverity,
    status?: string,
    limit: number = 100,
  ): Promise<Alert[]> {
    const where: any = {};
    if (severity) where.severity = severity;
    if (status) where.status = status;

    return this.alertRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.alertRepository.update(
      { id: alertId },
      { status: 'acknowledged', acknowledgedAt: new Date() },
    );
  }

  async resolveAlert(alertId: string): Promise<void> {
    await this.alertRepository.update(
      { id: alertId },
      { status: 'resolved', resolvedAt: new Date() },
    );
  }

  async getSystemHealth(): Promise<Record<string, any>> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const totalMetrics = await this.metricRepository.count();
    const recentMetrics = await this.metricRepository.count({
      where: {
        timestamp: Between(oneHourAgo, now),
      },
    });

    const openAlerts = await this.alertRepository.count({
      where: { status: 'open' },
    });

    const criticalAlerts = await this.alertRepository.count({
      where: { severity: AlertSeverity.CRITICAL, status: 'open' },
    });

    return {
      status: criticalAlerts > 0 ? 'unhealthy' : openAlerts > 10 ? 'degraded' : 'healthy',
      totalMetrics,
      recentMetrics,
      openAlerts,
      criticalAlerts,
      timestamp: now,
    };
  }

  private async checkAlerts(): Promise<void> {
    const rules = await this.alertRuleRepository.find({
      where: { isActive: true },
    });

    for (const rule of rules) {
      // Get recent metric values
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const metrics = await this.metricRepository.find({
        where: {
          name: rule.metricName,
          timestamp: Between(fiveMinutesAgo, now),
        },
        order: { timestamp: 'DESC' },
        take: 1,
      });

      if (metrics.length > 0) {
        const latestMetric = metrics[0];
        let shouldAlert = false;

        switch (rule.condition) {
          case 'greater_than':
            shouldAlert = Number(latestMetric.value) > rule.threshold;
            break;
          case 'less_than':
            shouldAlert = Number(latestMetric.value) < rule.threshold;
            break;
          case 'equals':
            shouldAlert = Number(latestMetric.value) === rule.threshold;
            break;
        }

        if (shouldAlert) {
          // Check if alert already exists
          const existingAlert = await this.alertRepository.findOne({
            where: {
              ruleId: rule.id,
              status: 'open',
            },
          });

          if (!existingAlert) {
            const alert = this.alertRepository.create({
              ruleId: rule.id,
              severity: rule.severity,
              message: `${rule.name}: ${latestMetric.value} ${rule.condition} ${rule.threshold}`,
              status: 'open',
              metricValue: {
                value: latestMetric.value,
                timestamp: latestMetric.timestamp,
              },
            });

            await this.alertRepository.save(alert);

            rule.triggerCount += 1;
            rule.lastTriggeredAt = new Date();
            await this.alertRuleRepository.save(rule);

            this.logger.warn(`Alert triggered: ${rule.name} (${rule.severity})`);
          }
        }
      }
    }
  }
}

