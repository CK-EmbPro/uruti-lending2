import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from '../entities/notification-preference.entity';
import {
  CreateNotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
  QueryNotificationPreferencesDto,
} from '../dto/notification-preference.dto';

@Injectable()
export class NotificationPreferenceService {
  private readonly logger = new Logger(NotificationPreferenceService.name);

  constructor(
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
  ) {}

  async create(dto: CreateNotificationPreferenceDto): Promise<NotificationPreference> {
    const preference = this.preferenceRepository.create(dto);
    return await this.preferenceRepository.save(preference);
  }

  async findAll(query: QueryNotificationPreferencesDto): Promise<NotificationPreference[]> {
    const queryBuilder = this.preferenceRepository.createQueryBuilder('preference');

    if (query.userId) {
      queryBuilder.andWhere('preference.userId = :userId', { userId: query.userId });
    }

    if (query.notificationType) {
      queryBuilder.andWhere('preference.notificationType = :notificationType', {
        notificationType: query.notificationType,
      });
    }

    if (query.channel) {
      queryBuilder.andWhere('preference.channel = :channel', { channel: query.channel });
    }

    return await queryBuilder.getMany();
  }

  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    return await this.preferenceRepository.find({
      where: { userId },
    });
  }

  async findOne(id: string): Promise<NotificationPreference> {
    const preference = await this.preferenceRepository.findOne({ where: { id } });

    if (!preference) {
      throw new NotFoundException(`Preference ${id} not found`);
    }

    return preference;
  }

  async update(
    id: string,
    dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreference> {
    const preference = await this.findOne(id);
    Object.assign(preference, dto);
    return await this.preferenceRepository.save(preference);
  }

  async delete(id: string): Promise<void> {
    const preference = await this.findOne(id);
    await this.preferenceRepository.remove(preference);
  }

  async bulkUpdate(
    userId: string,
    preferences: Array<{
      notificationType?: string | null;
      channel: string;
      enabled: boolean;
    }>,
  ): Promise<NotificationPreference[]> {
    const results: NotificationPreference[] = [];

    for (const pref of preferences) {
      let preference = await this.preferenceRepository.findOne({
        where: {
          userId,
          notificationType: (pref.notificationType ? pref.notificationType as any : null),
          channel: pref.channel as any,
        },
      });

      if (preference) {
        preference.enabled = pref.enabled;
        preference = await this.preferenceRepository.save(preference);
      } else {
        preference = this.preferenceRepository.create({
          userId,
          notificationType: pref.notificationType as any,
          channel: pref.channel as any,
          enabled: pref.enabled,
        });
        preference = await this.preferenceRepository.save(preference);
      }

      results.push(preference);
    }

    return results;
  }
}

