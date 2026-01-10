import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UptimeLog } from '../entities/uptime-log.entity';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class UptimeMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(UptimeMonitoringService.name);
  private readonly TARGET_UPTIME = 99.9; // 99.9% target
  private readonly RETENTION_DAYS = 90; // Keep logs for 90 days

  constructor(
    @InjectRepository(UptimeLog)
    private readonly uptimeLogRepository: Repository<UptimeLog>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    this.logger.log('Uptime monitoring service initialized');
    // Wait a bit for TypeORM to fully initialize before first health check
    setTimeout(async () => {
      try {
        // Perform initial health check
        await this.performHealthCheck();
      } catch (error) {
        this.logger.warn(`Initial health check failed (will retry on next cron): ${error.message}`);
      }
    }, 2000); // Wait 2 seconds for TypeORM to initialize
    // Note: cleanOldLogs() is already scheduled via @Cron, no need to call it here
  }

  /**
   * Perform health check and log result
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Check database connection
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      // Determine status
      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (responseTime > 1000) {
        status = 'degraded';
      }

      // Log the health check
      await this.uptimeLogRepository.save({
        status,
        details: {
          database: 'connected',
          responseTime,
        },
        timestamp: new Date(),
      });

      this.logger.debug(`Health check completed: ${status} (${responseTime}ms)`);
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      
      // Log as down
      await this.uptimeLogRepository.save({
        status: 'down',
        details: {
          database: 'disconnected',
          error: error.message,
        },
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get uptime percentage for a given period
   */
  async getUptimePercentage(days: number = 30): Promise<{
    uptime: number;
    target: number;
    meetsTarget: boolean;
    totalChecks: number;
    healthyChecks: number;
    degradedChecks: number;
    downChecks: number;
    period: { start: Date; end: Date };
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.uptimeLogRepository
      .createQueryBuilder('log')
      .where('log.timestamp >= :startDate', { startDate })
      .andWhere('log.timestamp <= :endDate', { endDate })
      .orderBy('log.timestamp', 'ASC')
      .getMany();

    const totalChecks = logs.length;
    const healthyChecks = logs.filter((log) => log.status === 'healthy').length;
    const degradedChecks = logs.filter((log) => log.status === 'degraded').length;
    const downChecks = logs.filter((log) => log.status === 'down').length;

    // Calculate uptime: healthy + degraded (at 50% weight) / total
    const uptime = totalChecks > 0
      ? ((healthyChecks + degradedChecks * 0.5) / totalChecks) * 100
      : 100;

    return {
      uptime: Math.round(uptime * 100) / 100,
      target: this.TARGET_UPTIME,
      meetsTarget: uptime >= this.TARGET_UPTIME,
      totalChecks,
      healthyChecks,
      degradedChecks,
      downChecks,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  }

  /**
   * Get uptime statistics
   */
  async getUptimeStats(): Promise<{
    last30Days: any;
    last7Days: any;
    last24Hours: any;
    currentStatus: string;
    lastCheck: Date | null;
  }> {
    const [last30Days, last7Days, last24Hours, lastLog] = await Promise.all([
      this.getUptimePercentage(30),
      this.getUptimePercentage(7),
      this.getUptimePercentage(1),
      this.uptimeLogRepository.findOne({
        order: { timestamp: 'DESC' },
      }),
    ]);

    return {
      last30Days,
      last7Days,
      last24Hours,
      currentStatus: lastLog?.status || 'unknown',
      lastCheck: lastLog?.timestamp || null,
    };
  }

  /**
   * Clean old logs (older than retention period)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanOldLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

    const result = await this.uptimeLogRepository.delete({
      timestamp: LessThan(cutoffDate),
    });

    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned ${result.affected} old uptime logs`);
    }
  }
}

