import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AnalyticsGateway } from '../gateways/analytics.gateway';

/**
 * Service to broadcast analytics metrics via WebSocket
 * Runs on a schedule to push real-time updates to connected clients
 */
@Injectable()
export class AnalyticsBroadcastService {
  private readonly logger = new Logger(AnalyticsBroadcastService.name);

  constructor(private readonly analyticsGateway: AnalyticsGateway) {}

  /**
   * Broadcast metrics every 30 seconds
   */
  @Cron('*/30 * * * * *') // Every 30 seconds
  async broadcastMetrics() {
    try {
      await this.analyticsGateway.broadcastMetrics();
      this.logger.debug('Broadcasted analytics metrics to connected clients');
    } catch (error) {
      this.logger.error(`Error broadcasting metrics: ${error.message}`);
    }
  }

  /**
   * Manual broadcast trigger
   */
  async triggerBroadcast(filters?: any) {
    await this.analyticsGateway.broadcastMetrics(filters);
  }
}

