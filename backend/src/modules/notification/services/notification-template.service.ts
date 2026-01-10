import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { CreateNotificationTemplateDto, UpdateNotificationTemplateDto } from '../dto/notification-template.dto';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
  ) {}

  async create(dto: CreateNotificationTemplateDto, userId?: string): Promise<NotificationTemplate> {
    // If this is set as default, unset other defaults for this type/channel
    if (dto.isDefault) {
      await this.templateRepository.update(
        {
          notificationType: dto.notificationType,
          channel: dto.channel,
          isDefault: true,
        },
        { isDefault: false },
      );
    }

    const template = this.templateRepository.create({
      ...dto,
      createdBy: userId,
    });

    return await this.templateRepository.save(template);
  }

  async findAll(
    notificationType?: NotificationType,
    channel?: NotificationChannel,
    isActive?: boolean,
  ): Promise<NotificationTemplate[]> {
    const query = this.templateRepository.createQueryBuilder('template');

    if (notificationType) {
      query.andWhere('template.notificationType = :notificationType', { notificationType });
    }

    if (channel) {
      query.andWhere('template.channel = :channel', { channel });
    }

    if (isActive !== undefined) {
      query.andWhere('template.isActive = :isActive', { isActive });
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    return template;
  }

  async getDefault(
    notificationType: NotificationType,
    channel: NotificationChannel,
  ): Promise<NotificationTemplate | null> {
    return await this.templateRepository.findOne({
      where: {
        notificationType,
        channel,
        isDefault: true,
        isActive: true,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateNotificationTemplateDto,
    userId?: string,
  ): Promise<NotificationTemplate> {
    const template = await this.findOne(id);

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.templateRepository.update(
        {
          notificationType: template.notificationType,
          channel: template.channel,
          isDefault: true,
          id: { $ne: id } as any,
        },
        { isDefault: false },
      );
    }

    Object.assign(template, dto);
    if (userId) {
      template.updatedBy = userId;
    }

    return await this.templateRepository.save(template);
  }

  async delete(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
  }
}

