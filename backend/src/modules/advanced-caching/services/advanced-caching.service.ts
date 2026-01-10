import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CacheEntry } from '../entities/cache-entry.entity';
import {
  CacheConfigDto,
  CacheStrategy,
  CacheTier,
  CacheStats,
} from '../dto/advanced-caching.dto';

@Injectable()
export class AdvancedCachingService {
  private readonly logger = new Logger(AdvancedCachingService.name);
  private readonly memoryCache = new Map<string, { value: any; expiresAt?: Date; accessCount: number; lastAccessed: Date }>();
  private readonly stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(
    @InjectRepository(CacheEntry)
    private cacheRepository: Repository<CacheEntry>,
  ) {
    // Cleanup expired entries periodically
    setInterval(() => this.cleanupExpiredEntries(), 60000); // Every minute
  }

  async set(config: CacheConfigDto): Promise<void> {
    const expiresAt = config.ttl
      ? new Date(Date.now() + config.ttl * 1000)
      : null;

    // Store in memory cache
    this.memoryCache.set(config.key, {
      value: config.value,
      expiresAt,
      accessCount: 0,
      lastAccessed: new Date(),
    });

    // Store in database for persistence (if tier is not MEMORY only)
    if (config.tier !== CacheTier.MEMORY) {
      const cacheEntry = this.cacheRepository.create({
        cacheKey: config.key,
        cacheValue: config.value,
        strategy: config.strategy || CacheStrategy.TTL,
        tier: config.tier || CacheTier.MEMORY,
        expiresAt,
        lastAccessedAt: new Date(),
      });

      await this.cacheRepository.save(cacheEntry);
    }
  }

  async get(key: string): Promise<any | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      // Check if expired
      if (memoryEntry.expiresAt && memoryEntry.expiresAt < new Date()) {
        this.memoryCache.delete(key);
        this.stats.misses++;
        return null;
      }

      // Update access stats
      memoryEntry.accessCount++;
      memoryEntry.lastAccessed = new Date();
      this.stats.hits++;

      return memoryEntry.value;
    }

    // Check database cache
    const dbEntry = await this.cacheRepository.findOne({
      where: { cacheKey: key },
    });

    if (dbEntry) {
      // Check if expired
      if (dbEntry.expiresAt && dbEntry.expiresAt < new Date()) {
        await this.cacheRepository.delete(dbEntry.id);
        this.stats.misses++;
        return null;
      }

      // Update access stats
      dbEntry.accessCount += 1;
      dbEntry.lastAccessedAt = new Date();
      await this.cacheRepository.save(dbEntry);

      // Promote to memory cache
      this.memoryCache.set(key, {
        value: dbEntry.cacheValue,
        expiresAt: dbEntry.expiresAt,
        accessCount: dbEntry.accessCount,
        lastAccessed: new Date(),
      });

      this.stats.hits++;
      return dbEntry.cacheValue;
    }

    this.stats.misses++;
    return null;
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.cacheRepository.delete({ cacheKey: key });
  }

  async clear(pattern?: string): Promise<number> {
    let deleted = 0;

    if (pattern) {
      // Delete matching keys from memory
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
          deleted++;
        }
      }

      // Delete matching keys from database
      const result = await this.cacheRepository
        .createQueryBuilder()
        .delete()
        .where('cacheKey LIKE :pattern', { pattern: `%${pattern}%` })
        .execute();

      deleted += result.affected || 0;
    } else {
      // Clear all
      this.memoryCache.clear();
      const result = await this.cacheRepository.delete({});
      deleted = result.affected || 0;
    }

    return deleted;
  }

  async getStats(): Promise<CacheStats> {
    const totalKeys = this.memoryCache.size + (await this.cacheRepository.count());
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    // Calculate memory usage (approximate)
    let memoryUsage = 0;
    for (const entry of this.memoryCache.values()) {
      memoryUsage += JSON.stringify(entry.value).length;
    }

    return {
      totalKeys,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      memoryUsage,
      evictions: this.stats.evictions,
    };
  }

  private async cleanupExpiredEntries(): Promise<void> {
    // Cleanup memory cache
    const now = new Date();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.memoryCache.delete(key);
        this.stats.evictions++;
      }
    }

    // Cleanup database cache
    const expired = await this.cacheRepository.find({
      where: {
        expiresAt: LessThan(now),
      },
    });

    if (expired.length > 0) {
      await this.cacheRepository.remove(expired);
      this.stats.evictions += expired.length;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    return this.clear(pattern);
  }

  async warmCache(keys: string[], loader: (key: string) => Promise<any>): Promise<void> {
    for (const key of keys) {
      const value = await loader(key);
      if (value) {
        await this.set({
          key,
          value,
          strategy: CacheStrategy.LRU,
          tier: CacheTier.MEMORY,
        });
      }
    }
  }
}
