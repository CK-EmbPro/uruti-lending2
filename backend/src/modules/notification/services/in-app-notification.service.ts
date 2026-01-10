import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from '../entities/notification-log.entity';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationStatus } from '../../../common/enums/notification-status.enum';

/**
 * In-App Notification Service
 * 
 * Stores notifications in database for in-app display
 */
@Injectable()
export class InAppNotificationService {
  private readonly logger = new Logger(InAppNotificationService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
  ) {}

  async send(options: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    metadata?: Record<string, any>;
  }): Promise<{ messageId: string; status: string }> {
    // In-app notifications are stored in the database
    // The frontend will fetch and display them
    
    // Create new in-app notification
    const notification = this.notificationLogRepository.create({
      recipientId: options.userId,
      notificationType: options.type,
      channel: 'In-App' as any,
      subject: options.title,
      body: options.body,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
      metadata: options.metadata,
    });

    const savedNotification = await this.notificationLogRepository.save(notification);

    this.logger.log(
      `[IN-APP] To: ${options.userId}, Title: ${options.title}`,
    );

    return {
      messageId: savedNotification.id,
      status: 'sent',
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationLogRepository.count({
      where: {
        recipientId: userId,
        channel: 'In-App' as any,
        status: NotificationStatus.SENT, // Not yet read
      },
    });
  }
}

