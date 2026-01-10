import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { APIKey, APIKeyStatus } from '../entities/api-key.entity';
import { Webhook, WebhookEvent, WebhookStatus } from '../entities/webhook.entity';
import { WebhookDelivery, DeliveryStatus } from '../entities/webhook-delivery.entity';
import {
  CreateAPIKeyDto,
  APIKeyResult,
  CreateWebhookDto,
  WebhookResult,
  WebhookDelivery as WebhookDeliveryDto,
  APIUsageStats,
} from '../dto/api-marketplace.dto';

@Injectable()
export class APIMarketplaceService {
  private readonly logger = new Logger(APIMarketplaceService.name);

  constructor(
    @InjectRepository(APIKey)
    private readonly apiKeyRepository: Repository<APIKey>,
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepository: Repository<WebhookDelivery>,
  ) {}

  /**
   * Create API key
   */
  async createAPIKey(
    dto: CreateAPIKeyDto,
    companyId: string,
  ): Promise<APIKeyResult> {
    this.logger.log(`Creating API key: ${dto.name} for company ${companyId}`);

    // Generate API key
    const apiKeyPrefix = 'sk_live_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const apiKey = `${apiKeyPrefix}${randomBytes}`;

    // Hash the API key for storage
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    const key = this.apiKeyRepository.create({
      companyId,
      name: dto.name,
      description: dto.description,
      apiKey: hashedKey,
      status: APIKeyStatus.ACTIVE,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      rateLimit: dto.rateLimit || 1000,
      allowedIPs: dto.allowedIPs || [],
      usageCount: 0,
    });

    const saved = await this.apiKeyRepository.save(key);

    return {
      id: saved.id,
      name: saved.name,
      apiKey, // Return plain key only on creation
      status: saved.status,
      createdAt: saved.createdAt.toISOString(),
      usageCount: saved.usageCount,
    };
  }

  /**
   * Get API keys
   */
  async getAPIKeys(companyId: string): Promise<APIKeyResult[]> {
    const keys = await this.apiKeyRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      status: k.status,
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt?.toISOString(),
      usageCount: k.usageCount,
    }));
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(keyId: string, companyId: string): Promise<void> {
    const key = await this.apiKeyRepository.findOne({
      where: { id: keyId, companyId },
    });

    if (!key) {
      throw new Error(`API key ${keyId} not found`);
    }

    key.status = APIKeyStatus.REVOKED;
    await this.apiKeyRepository.save(key);
  }

  /**
   * Create webhook
   */
  async createWebhook(
    dto: CreateWebhookDto,
    companyId: string,
  ): Promise<WebhookResult> {
    this.logger.log(`Creating webhook: ${dto.name} for company ${companyId}`);

    // Generate secret if not provided
    const secret = dto.secret || crypto.randomBytes(32).toString('hex');

    const webhook = this.webhookRepository.create({
      companyId,
      url: dto.url,
      name: dto.name,
      events: dto.events,
      secret,
      status: WebhookStatus.ACTIVE,
      isActive: dto.isActive !== false,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
    });

    const saved = await this.webhookRepository.save(webhook);

    return this.mapWebhookToResult(saved);
  }

  /**
   * Get webhooks
   */
  async getWebhooks(companyId: string): Promise<WebhookResult[]> {
    const webhooks = await this.webhookRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    return webhooks.map((w) => this.mapWebhookToResult(w));
  }

  /**
   * Get webhook deliveries
   */
  async getWebhookDeliveries(
    webhookId: string,
    companyId: string,
    limit: number = 50,
  ): Promise<WebhookDeliveryDto[]> {
    // Verify webhook belongs to company
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId, companyId },
    });

    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const deliveries = await this.deliveryRepository.find({
      where: { webhookId },
      order: { deliveredAt: 'DESC' },
      take: limit,
    });

    return deliveries.map((d) => ({
      id: d.id,
      webhookId: d.webhookId,
      event: d.event,
      status: d.status,
      responseCode: d.responseCode,
      responseTimeMs: d.responseTimeMs,
      errorMessage: d.errorMessage,
      deliveredAt: d.deliveredAt.toISOString(),
    }));
  }

  /**
   * Trigger webhook
   */
  async triggerWebhook(
    event: WebhookEvent,
    payload: Record<string, any>,
    companyId: string,
  ): Promise<void> {
    // Find active webhooks for this event
    const webhooks = await this.webhookRepository.find({
      where: {
        companyId,
        isActive: true,
        status: WebhookStatus.ACTIVE,
      },
    });

    const relevantWebhooks = webhooks.filter((w) => w.events.includes(event));

    for (const webhook of relevantWebhooks) {
      await this.deliverWebhook(webhook, event, payload);
    }
  }

  /**
   * Get API usage statistics
   */
  async getAPIUsageStats(
    companyId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<APIUsageStats> {
    // In production, this would query actual API usage logs
    // For now, return mock data based on API keys
    const keys = await this.apiKeyRepository.find({
      where: { companyId },
    });

    const totalCalls = keys.reduce((sum, key) => sum + key.usageCount, 0);
    const successfulCalls = Math.round(totalCalls * 0.98);
    const failedCalls = totalCalls - successfulCalls;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      averageResponseTime: 120,
      usageByEndpoint: {
        '/api/loans': Math.round(totalCalls * 0.4),
        '/api/applications': Math.round(totalCalls * 0.3),
        '/api/repayments': Math.round(totalCalls * 0.2),
        '/api/customers': Math.round(totalCalls * 0.1),
      },
      usageOverTime: this.generateUsageOverTime(totalCalls, startDate, endDate),
    };
  }

  // Private helper methods

  private async deliverWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    payload: Record<string, any>,
  ): Promise<void> {
    const startTime = Date.now();

    // Create delivery record
    const delivery = this.deliveryRepository.create({
      webhookId: webhook.id,
      event,
      payload,
      status: DeliveryStatus.PENDING,
      retryCount: 0,
    });

    await this.deliveryRepository.save(delivery);

    try {
      // Generate HMAC signature
      const signature = this.generateHMACSignature(JSON.stringify(payload), webhook.secret || '');

      // Send webhook (in production, would use HTTP client)
      // const response = await httpClient.post(webhook.url, payload, {
      //   headers: {
      //     'X-Webhook-Signature': signature,
      //     'X-Webhook-Event': event,
      //   },
      // });

      // Simulate response
      const responseTime = Date.now() - startTime;
      const responseCode = 200; // Would come from actual response

      delivery.status = DeliveryStatus.SUCCESS;
      delivery.responseCode = responseCode;
      delivery.responseTimeMs = responseTime;

      webhook.totalDeliveries++;
      webhook.successfulDeliveries++;
      webhook.lastDeliveryAt = new Date();

      if (webhook.status === WebhookStatus.FAILING) {
        webhook.status = WebhookStatus.ACTIVE; // Reset if successful
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      delivery.status = DeliveryStatus.FAILED;
      delivery.errorMessage = error.message;
      delivery.responseTimeMs = responseTime;

      webhook.totalDeliveries++;
      webhook.failedDeliveries++;

      // Mark as failing if too many failures
      if (webhook.failedDeliveries > 10 && webhook.failedDeliveries / webhook.totalDeliveries > 0.5) {
        webhook.status = WebhookStatus.FAILING;
      }
    }

    await this.deliveryRepository.save(delivery);
    await this.webhookRepository.save(webhook);
  }

  private generateHMACSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  private mapWebhookToResult(webhook: Webhook): WebhookResult {
    return {
      id: webhook.id,
      url: webhook.url,
      name: webhook.name,
      events: webhook.events,
      status: webhook.status,
      totalDeliveries: webhook.totalDeliveries,
      successfulDeliveries: webhook.successfulDeliveries,
      failedDeliveries: webhook.failedDeliveries,
      lastDeliveryAt: webhook.lastDeliveryAt?.toISOString(),
    };
  }

  private generateUsageOverTime(
    totalCalls: number,
    startDate?: Date,
    endDate?: Date,
  ): Array<{ date: string; calls: number; success: number; failed: number }> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const dailyCalls = days > 0 ? Math.round(totalCalls / days) : totalCalls;
    const timeSeries: Array<{ date: string; calls: number; success: number; failed: number }> = [];

    const current = new Date(start);
    while (current <= end) {
      timeSeries.push({
        date: current.toISOString().split('T')[0],
        calls: dailyCalls,
        success: Math.round(dailyCalls * 0.98),
        failed: Math.round(dailyCalls * 0.02),
      });
      current.setDate(current.getDate() + 1);
    }

    return timeSeries;
  }
}

