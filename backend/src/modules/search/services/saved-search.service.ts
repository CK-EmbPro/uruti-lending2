import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedSearch } from '../entities/saved-search.entity';
import { CreateSavedSearchDto, UpdateSavedSearchDto } from '../dto/saved-search.dto';
import { SearchEntityType } from '../../../common/enums/search-entity-type.enum';

@Injectable()
export class SavedSearchService {
  private readonly logger = new Logger(SavedSearchService.name);

  constructor(
    @InjectRepository(SavedSearch)
    private readonly savedSearchRepository: Repository<SavedSearch>,
  ) {}

  async create(dto: CreateSavedSearchDto, userId: string): Promise<SavedSearch> {
    // If setting as default, unset other defaults for this entity type
    if (dto.isDefault) {
      await this.savedSearchRepository.update(
        {
          userId,
          entityType: dto.entityType || null,
          isDefault: true,
        },
        { isDefault: false },
      );
    }

    const savedSearch = this.savedSearchRepository.create({
      ...dto,
      userId,
    });

    return await this.savedSearchRepository.save(savedSearch);
  }

  async findAll(userId: string, entityType?: SearchEntityType): Promise<SavedSearch[]> {
    const query = this.savedSearchRepository.createQueryBuilder('search').where(
      'search.userId = :userId',
      { userId },
    );

    if (entityType) {
      query.andWhere('search.entityType = :entityType', { entityType });
    }

    return await query.orderBy('search.useCount', 'DESC').addOrderBy('search.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, userId: string): Promise<SavedSearch> {
    const savedSearch = await this.savedSearchRepository.findOne({
      where: { id, userId },
    });

    if (!savedSearch) {
      throw new NotFoundException(`Saved search ${id} not found`);
    }

    return savedSearch;
  }

  async update(
    id: string,
    dto: UpdateSavedSearchDto,
    userId: string,
  ): Promise<SavedSearch> {
    const savedSearch = await this.findOne(id, userId);

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.savedSearchRepository.update(
        {
          userId,
          entityType: savedSearch.entityType,
          isDefault: true,
          id: { $ne: id } as any,
        },
        { isDefault: false },
      );
    }

    Object.assign(savedSearch, dto);
    return await this.savedSearchRepository.save(savedSearch);
  }

  async delete(id: string, userId: string): Promise<void> {
    const savedSearch = await this.findOne(id, userId);
    await this.savedSearchRepository.remove(savedSearch);
  }

  async incrementUseCount(id: string): Promise<SavedSearch> {
    const savedSearch = await this.savedSearchRepository.findOne({ where: { id } });
    if (savedSearch) {
      savedSearch.useCount += 1;
      savedSearch.lastUsedAt = new Date();
      return await this.savedSearchRepository.save(savedSearch);
    }
    throw new NotFoundException(`Saved search ${id} not found`);
  }

  async getDefaultSearch(
    userId: string,
    entityType?: SearchEntityType,
  ): Promise<SavedSearch | null> {
    return await this.savedSearchRepository.findOne({
      where: {
        userId,
        entityType: entityType || null,
        isDefault: true,
      },
    });
  }
}

