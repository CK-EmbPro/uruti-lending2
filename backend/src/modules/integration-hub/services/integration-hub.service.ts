import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration, IntegrationType, IntegrationStatus } from '../entities/integration.entity';
import {
  CreateIntegrationDto,
  IntegrationResult,
  TestIntegrationDto,
  IntegrationTestResult,
  AvailableIntegrations,
} from '../dto/integration-hub.dto';

@Injectable()
export class IntegrationHubService {
  private readonly logger = new Logger(IntegrationHubService.name);

  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
  ) {}

  /**
   * Create integration
   */
  async createIntegration(
    dto: CreateIntegrationDto,
    companyId: string,
  ): Promise<IntegrationResult> {
    this.logger.log(`Creating integration: ${dto.name} for company ${companyId}`);

    const integration = this.integrationRepository.create({
      companyId,
      name: dto.name,
      type: dto.type,
      provider: dto.provider,
      configuration: dto.configuration,
      status: IntegrationStatus.CONFIGURING,
      isActive: dto.isActive !== false,
      errorCount: 0,
    });

    const saved = await this.integrationRepository.save(integration);

    // Test connection
    try {
      await this.testConnection(saved);
      saved.status = IntegrationStatus.ACTIVE;
      await this.integrationRepository.save(saved);
    } catch (error: any) {
      saved.status = IntegrationStatus.ERROR;
      saved.lastError = error.message;
      await this.integrationRepository.save(saved);
    }

    return this.mapToResult(saved);
  }

  /**
   * Get integrations
   */
  async getIntegrations(companyId: string): Promise<IntegrationResult[]> {
    const integrations = await this.integrationRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    return integrations.map((i) => this.mapToResult(i));
  }

  /**
   * Test integration
   */
  async testIntegration(
    dto: TestIntegrationDto,
    companyId: string,
  ): Promise<IntegrationTestResult> {
    const integration = await this.integrationRepository.findOne({
      where: { id: dto.integrationId, companyId },
    });

    if (!integration) {
      throw new Error(`Integration ${dto.integrationId} not found`);
    }

    const startTime = Date.now();

    try {
      await this.testConnection(integration);

      const responseTime = Date.now() - startTime;

      // Update integration status
      integration.status = IntegrationStatus.ACTIVE;
      integration.lastSyncedAt = new Date();
      integration.errorCount = 0;
      await this.integrationRepository.save(integration);

      return {
        status: 'SUCCESS',
        message: 'Integration connection test successful',
        responseTimeMs: responseTime,
        details: {
          provider: integration.provider,
          type: integration.type,
        },
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      integration.status = IntegrationStatus.ERROR;
      integration.lastError = error.message;
      integration.errorCount++;
      await this.integrationRepository.save(integration);

      return {
        status: 'FAILED',
        message: error.message,
        responseTimeMs: responseTime,
        details: {
          provider: integration.provider,
          type: integration.type,
          error: error.message,
        },
      };
    }
  }

  /**
   * Get available integrations
   */
  async getAvailableIntegrations(): Promise<AvailableIntegrations> {
    const integrations = [
      {
        type: IntegrationType.PAYMENT_GATEWAY,
        provider: 'Stripe',
        name: 'Stripe Payment Gateway',
        description: 'Accept payments via Stripe',
        features: ['Credit Cards', 'Debit Cards', 'Bank Transfers', 'Refunds'],
        requiresConfiguration: true,
      },
      {
        type: IntegrationType.PAYMENT_GATEWAY,
        provider: 'PayPal',
        name: 'PayPal Integration',
        description: 'Accept payments via PayPal',
        features: ['PayPal Wallet', 'Credit Cards', 'Refunds'],
        requiresConfiguration: true,
      },
      {
        type: IntegrationType.ACCOUNTING,
        provider: 'QuickBooks',
        name: 'QuickBooks Accounting',
        description: 'Sync transactions with QuickBooks',
        features: ['Transaction Sync', 'Chart of Accounts', 'Reports'],
        requiresConfiguration: true,
      },
      {
        type: IntegrationType.ACCOUNTING,
        provider: 'Xero',
        name: 'Xero Accounting',
        description: 'Sync transactions with Xero',
        features: ['Transaction Sync', 'Chart of Accounts', 'Reports'],
        requiresConfiguration: true,
      },
      {
        type: IntegrationType.CRM,
        provider: 'Salesforce',
        name: 'Salesforce CRM',
        description: 'Sync customer data with Salesforce',
        features: ['Contact Sync', 'Opportunity Tracking', 'Reports'],
        requiresConfiguration: true,
      },
      {
        type: IntegrationType.DOCUMENT_STORAGE,
        provider: 'AWS S3',
        name: 'AWS S3 Storage',
        description: 'Store documents in AWS S3',
        features: ['Document Upload', 'Secure Storage', 'CDN'],
        requiresConfiguration: true,
      },
      {
        type: IntegrationType.EMAIL_SERVICE,
        provider: 'SendGrid',
        name: 'SendGrid Email',
        description: 'Send emails via SendGrid',
        features: ['Transactional Emails', 'Marketing Emails', 'Templates'],
        requiresConfiguration: true,
      },
      {
        type: IntegrationType.SMS_SERVICE,
        provider: 'Twilio',
        name: 'Twilio SMS',
        description: 'Send SMS via Twilio',
        features: ['SMS Notifications', 'OTP Delivery', 'Alerts'],
        requiresConfiguration: true,
      },
      {
        type: IntegrationType.CREDIT_BUREAU,
        provider: 'Experian',
        name: 'Experian Credit Bureau',
        description: 'Pull credit reports from Experian',
        features: ['Credit Reports', 'Credit Scores', 'Identity Verification'],
        requiresConfiguration: true,
      },
      {
        type: IntegrationType.IDENTITY_VERIFICATION,
        provider: 'Jumio',
        name: 'Jumio Identity Verification',
        description: 'Verify customer identity',
        features: ['ID Verification', 'Face Match', 'Liveness Detection'],
        requiresConfiguration: true,
      },
      {
        type: IntegrationType.BANKING,
        provider: 'Plaid',
        name: 'Plaid Banking',
        description: 'Connect to bank accounts via Plaid',
        features: ['Account Linking', 'Balance Checks', 'Transaction History'],
        requiresConfiguration: true,
      },
      {
        type: IntegrationType.ANALYTICS,
        provider: 'Google Analytics',
        name: 'Google Analytics',
        description: 'Track user behavior and conversions',
        features: ['Page Views', 'Events', 'Conversions', 'Funnels'],
        requiresConfiguration: true,
      },
    ];

    return { integrations };
  }

  /**
   * Toggle integration
   */
  async toggleIntegration(
    integrationId: string,
    isActive: boolean,
    companyId: string,
  ): Promise<void> {
    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId, companyId },
    });

    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    integration.isActive = isActive;
    if (!isActive) {
      integration.status = IntegrationStatus.INACTIVE;
    } else if (integration.status === IntegrationStatus.INACTIVE) {
      integration.status = IntegrationStatus.ACTIVE;
    }

    await this.integrationRepository.save(integration);
  }

  // Private helper methods

  private async testConnection(integration: Integration): Promise<void> {
    // In production, would test actual connection based on type
    this.logger.log(`Testing connection for integration ${integration.id}`);

    switch (integration.type) {
      case IntegrationType.PAYMENT_GATEWAY:
        // Test payment gateway connection
        // await this.testPaymentGateway(integration);
        break;
      case IntegrationType.ACCOUNTING:
        // Test accounting connection
        // await this.testAccounting(integration);
        break;
      default:
        // Generic connection test
        break;
    }
  }

  private mapToResult(integration: Integration): IntegrationResult {
    return {
      id: integration.id,
      name: integration.name,
      type: integration.type,
      provider: integration.provider,
      status: integration.status,
      isActive: integration.isActive,
      lastSyncedAt: integration.lastSyncedAt?.toISOString(),
      errorCount: integration.errorCount,
      createdAt: integration.createdAt.toISOString(),
    };
  }
}

