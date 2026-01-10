import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingCampaign, CampaignStatus, CampaignType, TriggerEvent } from '../entities/marketing-campaign.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';
import {
  CreateCampaignDto,
  CampaignResult,
  CampaignAnalytics,
} from '../dto/marketing-automation.dto';
import { ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';

@Injectable()
export class MarketingAutomationService {
  private readonly logger = new Logger(MarketingAutomationService.name);

  constructor(
    @InjectRepository(MarketingCampaign)
    private readonly campaignRepository: Repository<MarketingCampaign>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create marketing campaign
   */
  async createCampaign(
    dto: CreateCampaignDto,
    companyId: string,
  ): Promise<CampaignResult> {
    this.logger.log(`Creating marketing campaign: ${dto.campaignName}`);

    const campaign = this.campaignRepository.create({
      companyId,
      campaignName: dto.campaignName,
      campaignType: dto.campaignType,
      description: dto.description,
      subject: dto.subject,
      content: dto.content,
      triggerEvent: dto.triggerEvent,
      scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
      segmentCriteria: dto.segmentCriteria,
      customerIds: dto.customerIds,
      isABTest: dto.isABTest || false,
      abTestVariants: dto.abTestVariants,
      status: dto.scheduledDate ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
    });

    const saved = await this.campaignRepository.save(campaign);

    // If scheduled, calculate recipients
    if (saved.status === CampaignStatus.SCHEDULED) {
      const recipients = await this.calculateRecipients(saved, companyId);
      saved.totalRecipients = recipients.length;
      await this.campaignRepository.save(saved);
    }

    return this.mapToResult(saved);
  }

  /**
   * Execute campaign
   */
  async executeCampaign(
    campaignId: string,
    companyId: string,
  ): Promise<CampaignResult> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, companyId },
    });

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new Error(`Campaign ${campaignId} cannot be executed in status ${campaign.status}`);
    }

    campaign.status = CampaignStatus.RUNNING;
    campaign.startedAt = new Date();
    await this.campaignRepository.save(campaign);

    // Get recipients
    const recipients = await this.calculateRecipients(campaign, companyId);
    campaign.totalRecipients = recipients.length;

    // Send campaign
    let sentCount = 0;
    let deliveredCount = 0;

    for (const recipient of recipients) {
      try {
        await this.sendCampaignMessage(campaign, recipient);
        sentCount++;
        deliveredCount++;
      } catch (error: any) {
        this.logger.error(`Failed to send campaign message to ${recipient.email}: ${error.message}`);
        sentCount++;
      }
    }

    campaign.sentCount = sentCount;
    campaign.deliveredCount = deliveredCount;
    campaign.status = CampaignStatus.COMPLETED;
    campaign.completedAt = new Date();
    await this.campaignRepository.save(campaign);

    return this.mapToResult(campaign);
  }

  /**
   * Handle trigger event
   */
  async handleTriggerEvent(
    event: TriggerEvent,
    entityType: string,
    entityId: string,
    companyId: string,
  ): Promise<void> {
    this.logger.log(`Handling trigger event: ${event} for ${entityType}:${entityId}`);

    // Find active campaigns for this trigger
    const campaigns = await this.campaignRepository.find({
      where: {
        companyId,
        triggerEvent: event,
        status: CampaignStatus.RUNNING,
      },
    });

    for (const campaign of campaigns) {
      // Check if campaign should be sent for this entity
      if (await this.shouldSendCampaign(campaign, entityType, entityId, companyId)) {
        await this.sendTriggeredCampaign(campaign, entityType, entityId, companyId);
      }
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(
    campaignId: string,
    companyId: string,
  ): Promise<CampaignAnalytics> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, companyId },
    });

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const metrics = {
      totalRecipients: campaign.totalRecipients,
      sent: campaign.sentCount,
      delivered: campaign.deliveredCount,
      opened: campaign.openedCount,
      clicked: campaign.clickedCount,
      converted: campaign.conversionCount,
      bounced: campaign.bouncedCount,
      unsubscribed: campaign.unsubscribedCount,
    };

    const rates = {
      deliveryRate: campaign.sentCount > 0 ? (campaign.deliveredCount / campaign.sentCount) * 100 : 0,
      openRate: campaign.deliveredCount > 0 ? (campaign.openedCount / campaign.deliveredCount) * 100 : 0,
      clickRate: campaign.deliveredCount > 0 ? (campaign.clickedCount / campaign.deliveredCount) * 100 : 0,
      conversionRate: campaign.deliveredCount > 0 ? (campaign.conversionCount / campaign.deliveredCount) * 100 : 0,
      bounceRate: campaign.sentCount > 0 ? (campaign.bouncedCount / campaign.sentCount) * 100 : 0,
      unsubscribeRate: campaign.deliveredCount > 0 ? (campaign.unsubscribedCount / campaign.deliveredCount) * 100 : 0,
    };

    // Generate time-series data (simplified)
    const timeSeries = this.generateTimeSeriesData(campaign);

    return {
      campaignId: campaign.id,
      metrics,
      rates: {
        deliveryRate: Math.round(rates.deliveryRate * 100) / 100,
        openRate: Math.round(rates.openRate * 100) / 100,
        clickRate: Math.round(rates.clickRate * 100) / 100,
        conversionRate: Math.round(rates.conversionRate * 100) / 100,
        bounceRate: Math.round(rates.bounceRate * 100) / 100,
        unsubscribeRate: Math.round(rates.unsubscribeRate * 100) / 100,
      },
      timeSeries,
    };
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(companyId: string): Promise<CampaignResult[]> {
    const campaigns = await this.campaignRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    return campaigns.map((c) => this.mapToResult(c));
  }

  // Private helper methods

  private async calculateRecipients(
    campaign: MarketingCampaign,
    companyId: string,
  ): Promise<Array<{ id: string; email: string; phone?: string }>> {
    // If manual campaign with customer IDs
    if (campaign.customerIds && campaign.customerIds.length > 0) {
      // In production, would fetch customer details
      return campaign.customerIds.map((id) => ({
        id,
        email: `customer-${id}@example.com`,
        phone: '+1234567890',
      }));
    }

    // If segment-based campaign
    if (campaign.segmentCriteria && campaign.segmentCriteria.length > 0) {
      return await this.getSegmentedCustomers(campaign.segmentCriteria, companyId);
    }

    // If trigger-based campaign, recipients will be determined at trigger time
    return [];
  }

  private async getSegmentedCustomers(
    criteria: Array<{ field: string; operator: string; value: any }>,
    companyId: string,
  ): Promise<Array<{ id: string; email: string; phone?: string }>> {
    // In production, would query customers based on criteria
    // For now, return empty array
    return [];
  }

  private async sendCampaignMessage(
    campaign: MarketingCampaign,
    recipient: { id: string; email: string; phone?: string },
  ): Promise<void> {
    // Determine channel based on campaign type
    let channel: NotificationChannel;
    switch (campaign.campaignType) {
      case CampaignType.EMAIL:
        channel = NotificationChannel.EMAIL;
        break;
      case CampaignType.SMS:
        channel = NotificationChannel.SMS;
        break;
      case CampaignType.PUSH:
        channel = NotificationChannel.PUSH;
        break;
      case CampaignType.IN_APP:
        channel = NotificationChannel.IN_APP;
        break;
      default:
        channel = NotificationChannel.EMAIL;
    }

    // Send notification
    await this.notificationService.sendNotification({
      recipientId: recipient.id,
      notificationType: NotificationType.PROMOTIONAL,
      channel,
      subject: campaign.subject || campaign.campaignName,
      body: campaign.content,
      metadata: {
        recipientEmail: recipient.email,
        recipientPhone: recipient.phone,
        campaignId: campaign.id,
      },
    });
  }

  private async shouldSendCampaign(
    campaign: MarketingCampaign,
    entityType: string,
    entityId: string,
    companyId: string,
  ): Promise<boolean> {
    // Check segment criteria if any
    if (campaign.segmentCriteria && campaign.segmentCriteria.length > 0) {
      // In production, would evaluate criteria against entity
      return true; // Simplified
    }

    return true;
  }

  private async sendTriggeredCampaign(
    campaign: MarketingCampaign,
    entityType: string,
    entityId: string,
    companyId: string,
  ): Promise<void> {
    // Get recipient from entity
    let recipient: { id: string; email: string; phone?: string } | null = null;

    if (entityType === 'LoanApplication') {
      const application = await this.applicationRepository.findOne({
        where: { id: entityId, companyId },
      });
      if (application) {
        recipient = {
          id: application.applicantId,
          email: `customer-${application.applicantId}@example.com`,
        };
      }
    } else if (entityType === 'Loan') {
      const loan = await this.loanRepository.findOne({
        where: { id: entityId, companyId },
      });
      if (loan) {
        recipient = {
          id: loan.applicantId,
          email: `customer-${loan.applicantId}@example.com`,
        };
      }
    }

    if (recipient) {
      await this.sendCampaignMessage(campaign, recipient);
      campaign.sentCount++;
      campaign.deliveredCount++;
      await this.campaignRepository.save(campaign);
    }
  }

  private generateTimeSeriesData(campaign: MarketingCampaign): Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  }> {
    // Simplified time-series generation
    if (!campaign.startedAt) {
      return [];
    }

    const timeSeries: Array<{
      date: string;
      sent: number;
      opened: number;
      clicked: number;
      converted: number;
    }> = [];

    const startDate = new Date(campaign.startedAt);
    const endDate = campaign.completedAt || new Date();
    const current = new Date(startDate);

    while (current <= endDate) {
      const date = current.toISOString().split('T')[0];
      // Distribute metrics across days (simplified)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailySent = daysDiff > 0 ? Math.round(campaign.sentCount / daysDiff) : campaign.sentCount;
      const dailyOpened = daysDiff > 0 ? Math.round(campaign.openedCount / daysDiff) : campaign.openedCount;
      const dailyClicked = daysDiff > 0 ? Math.round(campaign.clickedCount / daysDiff) : campaign.clickedCount;
      const dailyConverted = daysDiff > 0 ? Math.round(campaign.conversionCount / daysDiff) : campaign.conversionCount;

      timeSeries.push({
        date,
        sent: dailySent,
        opened: dailyOpened,
        clicked: dailyClicked,
        converted: dailyConverted,
      });

      current.setDate(current.getDate() + 1);
    }

    return timeSeries;
  }

  private mapToResult(campaign: MarketingCampaign): CampaignResult {
    const openRate = campaign.deliveredCount > 0 ? (campaign.openedCount / campaign.deliveredCount) * 100 : 0;
    const clickRate = campaign.deliveredCount > 0 ? (campaign.clickedCount / campaign.deliveredCount) * 100 : 0;
    const conversionRate = campaign.deliveredCount > 0 ? (campaign.conversionCount / campaign.deliveredCount) * 100 : 0;

    return {
      id: campaign.id,
      campaignName: campaign.campaignName,
      campaignType: campaign.campaignType,
      status: campaign.status,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      openedCount: campaign.openedCount,
      clickedCount: campaign.clickedCount,
      conversionCount: campaign.conversionCount,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }
}

