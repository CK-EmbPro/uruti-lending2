import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RateLimitRuleEnhanced } from '../entities/rate-limit-rule-enhanced.entity';
import { RateLimitLog } from '../entities/rate-limit-log.entity';
import { CreateRateLimitRuleDto, RateLimitStats, RateLimitStrategy, RateLimitScope } from '../dto/rate-limiting.dto';

@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);
  private readonly rateLimitStore = new Map<string, { count: number; resetAt: Date }>();

  constructor(
    @InjectRepository(RateLimitRuleEnhanced)
    private ruleRepository: Repository<RateLimitRuleEnhanced>,
    @InjectRepository(RateLimitLog)
    private logRepository: Repository<RateLimitLog>,
  ) {
    // Cleanup expired entries periodically
    setInterval(() => this.cleanupExpiredEntries(), 60000); // Every minute
  }

  async createRule(createDto: CreateRateLimitRuleDto): Promise<RateLimitRuleEnhanced> {
    const rule = this.ruleRepository.create({
      ...createDto,
      isActive: createDto.isActive !== undefined ? createDto.isActive : true,
    });

    return this.ruleRepository.save(rule);
  }

  async findAllRules(isActive?: boolean): Promise<RateLimitRuleEnhanced[]> {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.ruleRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async checkRateLimit(
    endpoint: string,
    identifier: string,
    scope: RateLimitScope,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    // Find matching rules
    const rules = await this.ruleRepository.find({
      where: { isActive: true },
    });

    const matchingRules = rules.filter(rule =>
      this.matchesPattern(endpoint, rule.endpointPattern) &&
      rule.scope === scope,
    );

    if (matchingRules.length === 0) {
      return { allowed: true, remaining: Infinity, resetAt: new Date() };
    }

    // Use the most restrictive rule
    const rule = matchingRules.reduce((prev, current) =>
      current.maxRequests < prev.maxRequests ? current : prev,
    );

    const key = `${rule.id}:${identifier}`;
    const now = new Date();

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(key);
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: new Date(now.getTime() + rule.timeWindow * 1000),
      };
      this.rateLimitStore.set(key, entry);
    }

    // Check rate limit based on strategy
    let allowed = true;
    switch (rule.strategy) {
      case RateLimitStrategy.FIXED_WINDOW:
        allowed = entry.count < rule.maxRequests;
        break;
      case RateLimitStrategy.SLIDING_WINDOW:
        // Simplified sliding window
        allowed = entry.count < rule.maxRequests;
        break;
      case RateLimitStrategy.TOKEN_BUCKET:
        // Simplified token bucket
        allowed = entry.count < rule.maxRequests;
        break;
      case RateLimitStrategy.LEAKY_BUCKET:
        // Simplified leaky bucket
        allowed = entry.count < rule.maxRequests;
        break;
    }

    if (allowed) {
      entry.count += 1;
    }

    // Log the request
    await this.logRequest(rule.id, identifier, endpoint, allowed, entry.count, rule.maxRequests);

    // Update rule statistics
    rule.totalRequests += 1;
    if (!allowed) {
      rule.blockedRequests += 1;
    }
    await this.ruleRepository.save(rule);

    return {
      allowed,
      remaining: Math.max(0, rule.maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }

  private matchesPattern(endpoint: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(endpoint);
  }

  private async logRequest(
    ruleId: string,
    identifier: string,
    endpoint: string,
    isBlocked: boolean,
    currentCount: number,
    maxAllowed: number,
  ): Promise<void> {
    const log = this.logRepository.create({
      ruleId,
      identifier,
      endpoint,
      isBlocked,
      currentCount,
      maxAllowed,
      timestamp: new Date(),
    });

    await this.logRepository.save(log);
  }

  private cleanupExpiredEntries(): void {
    const now = new Date();
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  async getStats(ruleId?: string): Promise<RateLimitStats> {
    const where: any = {};
    if (ruleId) where.ruleId = ruleId;

    const logs = await this.logRepository.find({ where });
    const totalRequests = logs.length;
    const blockedRequests = logs.filter(l => l.isBlocked).length;
    const allowedRequests = totalRequests - blockedRequests;
    const blockRate = totalRequests > 0 ? blockedRequests / totalRequests : 0;

    // Get top blocked IPs
    const blockedByIP = new Map<string, number>();
    logs.filter(l => l.isBlocked).forEach(log => {
      const count = blockedByIP.get(log.identifier) || 0;
      blockedByIP.set(log.identifier, count + 1);
    });

    const topBlockedIPs = Array.from(blockedByIP.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top blocked users
    const blockedByUser = new Map<string, number>();
    logs.filter(l => l.isBlocked && l.identifier.startsWith('user:')).forEach(log => {
      const userId = log.identifier.replace('user:', '');
      const count = blockedByUser.get(userId) || 0;
      blockedByUser.set(userId, count + 1);
    });

    const topBlockedUsers = Array.from(blockedByUser.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      allowedRequests,
      blockedRequests,
      blockRate,
      topBlockedIPs,
      topBlockedUsers,
    };
  }
}

