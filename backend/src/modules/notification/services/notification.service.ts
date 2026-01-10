import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from '../entities/notification-log.entity';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { CreateNotificationDto, BulkNotificationDto } from '../dto/create-notification.dto';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';
import { NotificationStatus } from '../../../common/enums/notification-status.enum';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';
import { PushNotificationService } from './push-notification.service';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationGateway } from '../gateways/notification.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
    private readonly emailService: EmailService,
    private readonly smsService: SMSService,
    private readonly pushService: PushNotificationService,
    private readonly inAppService: InAppNotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * Send a single notification
   */
  async sendNotification(dto: CreateNotificationDto): Promise<NotificationLog> {
    // Check user preferences
    const canSend = await this.checkUserPreference(
      dto.recipientId,
      dto.notificationType,
      dto.channel,
    );

    if (!canSend) {
      throw new BadRequestException(
        `User ${dto.recipientId} has disabled ${dto.channel} notifications for ${dto.notificationType}`,
      );
    }

    // Get template if provided
    let subject = dto.subject;
    let body = dto.body;

    if (dto.templateId) {
      const template = await this.templateRepository.findOne({
        where: { id: dto.templateId },
      });

      if (!template) {
        throw new NotFoundException(`Template ${dto.templateId} not found`);
      }

      subject = this.replaceTemplateVariables(template.subject, dto.variables || {});
      body = this.replaceTemplateVariables(template.body, dto.variables || {});
    }

    // Create notification log
    const notificationLog = this.notificationLogRepository.create({
      recipientId: dto.recipientId,
      recipientEmail: dto.metadata?.recipientEmail || null,
      recipientPhone: dto.metadata?.recipientPhone || null,
      notificationType: dto.notificationType,
      channel: dto.channel,
      subject,
      body,
      status: NotificationStatus.PENDING,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
      templateId: dto.templateId,
      metadata: dto.metadata,
    });

    const savedLog = await this.notificationLogRepository.save(notificationLog);

    // Send notification based on channel
    if (dto.scheduledFor) {
      // Schedule for future (would use a job queue in production)
      this.logger.log(`Notification ${savedLog.id} scheduled for ${dto.scheduledFor}`);
      return savedLog;
    }

    // Send immediately
    await this.sendByChannel(savedLog);

    // Emit real-time notification via WebSocket
    this.emitRealTimeNotification(savedLog);

    return savedLog;
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotification(dto: BulkNotificationDto): Promise<NotificationLog[]> {
    const notifications: NotificationLog[] = [];

    for (const recipientId of dto.recipientIds) {
      try {
        const notification = await this.sendNotification({
          recipientId,
          notificationType: dto.notificationType,
          channel: dto.channel,
          subject: dto.subject,
          body: dto.body,
          templateId: dto.templateId,
          variables: dto.variables,
          metadata: dto.metadata,
        });
        notifications.push(notification);
      } catch (error) {
        this.logger.error(`Failed to send notification to ${recipientId}: ${error.message}`);
      }
    }

    return notifications;
  }

  /**
   * Send notification by channel
   */
  private async sendByChannel(notificationLog: NotificationLog): Promise<void> {
    try {
      let result: any;

      switch (notificationLog.channel) {
        case NotificationChannel.EMAIL:
          result = await this.emailService.send({
            to: notificationLog.recipientEmail || '',
            subject: notificationLog.subject,
            body: notificationLog.body,
          });
          break;

        case NotificationChannel.SMS:
          result = await this.smsService.send({
            to: notificationLog.recipientPhone || '',
            message: notificationLog.body,
          });
          break;

        case NotificationChannel.PUSH:
          result = await this.pushService.send({
            userId: notificationLog.recipientId,
            title: notificationLog.subject,
            body: notificationLog.body,
            data: notificationLog.metadata,
          });
          break;

        case NotificationChannel.IN_APP:
          result = await this.inAppService.send({
            userId: notificationLog.recipientId,
            title: notificationLog.subject,
            body: notificationLog.body,
            type: notificationLog.notificationType,
            metadata: notificationLog.metadata,
          });
          break;

        default:
          throw new BadRequestException(`Unsupported channel: ${notificationLog.channel}`);
      }

      // Update notification log
      notificationLog.status = NotificationStatus.SENT;
      notificationLog.sentAt = new Date();
      notificationLog.providerResponse = result;

      await this.notificationLogRepository.save(notificationLog);

      this.logger.log(
        `Notification ${notificationLog.id} sent via ${notificationLog.channel} to ${notificationLog.recipientId}`,
      );
    } catch (error) {
      notificationLog.status = NotificationStatus.FAILED;
      notificationLog.errorMessage = error.message;
      notificationLog.retryCount += 1;

      await this.notificationLogRepository.save(notificationLog);

      this.logger.error(
        `Failed to send notification ${notificationLog.id}: ${error.message}`,
      );

      throw error;
    }
  }

  /**
   * Check if user has enabled this notification type/channel
   */
  private async checkUserPreference(
    userId: string,
    notificationType: NotificationType,
    channel: NotificationChannel,
  ): Promise<boolean> {
    // Check specific preference
    const specificPreference = await this.preferenceRepository.findOne({
      where: {
        userId,
        notificationType,
        channel,
      },
    });

    if (specificPreference) {
      return specificPreference.enabled;
    }

    // Check global preference for channel
    const globalPreference = await this.preferenceRepository.findOne({
      where: {
        userId,
        notificationType: null,
        channel,
      },
    });

    if (globalPreference) {
      return globalPreference.enabled;
    }

    // Default: allow if no preference set
    return true;
  }

  /**
   * Replace template variables in string
   */
  private replaceTemplateVariables(
    template: string,
    variables: Record<string, any>,
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Get notification logs for a user
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ notifications: NotificationLog[]; total: number }> {
    const [notifications, total] = await this.notificationLogRepository.findAndCount({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { notifications, total };
  }

  /**
   * Emit real-time notification via WebSocket
   */
  private emitRealTimeNotification(notificationLog: NotificationLog): void {
    try {
      // Only emit for in-app notifications or when channel supports real-time
      if (
        notificationLog.channel === NotificationChannel.IN_APP ||
        notificationLog.channel === NotificationChannel.PUSH
      ) {
        const notificationData = {
          id: notificationLog.id,
          recipientId: notificationLog.recipientId,
          notificationType: notificationLog.notificationType,
          channel: notificationLog.channel,
          subject: notificationLog.subject,
          body: notificationLog.body,
          status: notificationLog.status,
          metadata: notificationLog.metadata,
          createdAt: notificationLog.createdAt,
          readAt: notificationLog.readAt,
        };

        // Send to specific user
        this.notificationGateway.sendNotificationToUser(notificationLog.recipientId, notificationData);

        // Also broadcast to notification type room if subscribed
        this.notificationGateway.server
          .to(`notification-type:${notificationLog.notificationType}`)
          .emit('notification', notificationData);
      }
    } catch (error) {
      this.logger.error(`Failed to emit real-time notification: ${error.message}`);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationLog> {
    const notification = await this.notificationLogRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    const saved = await this.notificationLogRepository.save(notification);

    // Emit real-time update
    this.notificationGateway.sendNotificationToUser(notification.recipientId, {
      id: notification.id,
      readAt: notification.readAt,
      type: 'read',
    });

    return saved;
  }

  /**
   * Get notification statistics
   */
  async getStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    byChannel: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const query = this.notificationLogRepository.createQueryBuilder('log');

    if (startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate });
    }

    const all = await query.getMany();

    const stats = {
      total: all.length,
      sent: all.filter((n) => n.status === NotificationStatus.SENT).length,
      delivered: all.filter((n) => n.status === NotificationStatus.DELIVERED).length,
      failed: all.filter((n) => n.status === NotificationStatus.FAILED).length,
      byChannel: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    // Count by channel
    for (const notification of all) {
      stats.byChannel[notification.channel] =
        (stats.byChannel[notification.channel] || 0) + 1;
      stats.byType[notification.notificationType] =
        (stats.byType[notification.notificationType] || 0) + 1;
    }

    return stats;
  }
}

