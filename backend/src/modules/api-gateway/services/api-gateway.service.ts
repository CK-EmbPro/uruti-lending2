import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { ApiRoute } from '../entities/api-route.entity';
import { RequestMethod } from '../dto/api-gateway.dto';
import { RateLimitRule } from '../entities/rate-limit-rule.entity';
import { ApiRequestLog, RequestStatus } from '../entities/api-request-log.entity';
import {
  CreateApiRouteDto,
  CreateRateLimitRuleDto,
  ApiRoute as ApiRouteDto,
  ApiGatewayStats,
} from '../dto/api-gateway.dto';

@Injectable()
export class ApiGatewayService {
  private readonly logger = new Logger(ApiGatewayService.name);

  constructor(
    @InjectRepository(ApiRoute)
    private routeRepository: Repository<ApiRoute>,
    @InjectRepository(RateLimitRule)
    private rateLimitRepository: Repository<RateLimitRule>,
    @InjectRepository(ApiRequestLog)
    private requestLogRepository: Repository<ApiRequestLog>,
  ) {}

  async createRoute(createDto: CreateApiRouteDto): Promise<ApiRoute> {
    const existing = await this.routeRepository.findOne({
      where: { routePath: createDto.routePath },
    });

    if (existing) {
      throw new BadRequestException(`Route ${createDto.routePath} already exists`);
    }

    const route = this.routeRepository.create({
      ...createDto,
      methods: createDto.methods || [RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE],
    });

    return this.routeRepository.save(route);
  }

  async findAllRoutes(isActive?: boolean): Promise<ApiRoute[]> {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.routeRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneRoute(id: string): Promise<ApiRoute> {
    const route = await this.routeRepository.findOne({ where: { id } });
    if (!route) {
      throw new NotFoundException(`API route with ID ${id} not found`);
    }
    return route;
  }

  async findRouteByPath(path: string): Promise<ApiRoute | null> {
    return this.routeRepository.findOne({
      where: { routePath: path, isActive: true },
    });
  }

  async createRateLimitRule(createDto: CreateRateLimitRuleDto): Promise<RateLimitRule> {
    const rule = this.rateLimitRepository.create(createDto);
    return this.rateLimitRepository.save(rule);
  }

  async checkRateLimit(
    routePath: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    // Find matching rate limit rules
    const rules = await this.rateLimitRepository.find({
      where: { isActive: true },
    });

    for (const rule of rules) {
      if (this.matchesPattern(routePath, rule.routePattern)) {
        // Check rate limit based on strategy
        const result = await this.checkRateLimitForRule(
          rule,
          routePath,
          userId,
          ipAddress,
        );

        if (!result.allowed) {
          rule.blockedCount += 1;
          await this.rateLimitRepository.save(rule);
          return result;
        }

        rule.hitCount += 1;
        await this.rateLimitRepository.save(rule);
      }
    }

    // No rate limit rules matched, allow request
    return {
      allowed: true,
      remaining: 999999,
      resetAt: new Date(Date.now() + 60000),
    };
  }

  private matchesPattern(path: string, pattern: string): boolean {
    // Simple pattern matching (support * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(path);
  }

  private async checkRateLimitForRule(
    rule: RateLimitRule,
    routePath: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    // Get recent requests for this rule
    const windowStart = new Date(Date.now() - rule.timeWindow * 1000);
    const recentRequests = await this.requestLogRepository.count({
      where: {
        routePath,
        requestDate: MoreThan(windowStart),
        ...(userId ? { userId } : {}),
        ...(ipAddress ? { ipAddress } : {}),
      },
    });

    const remaining = Math.max(0, rule.maxRequests - recentRequests);
    const resetAt = new Date(Date.now() + rule.timeWindow * 1000);

    return {
      allowed: recentRequests < rule.maxRequests,
      remaining,
      resetAt,
    };
  }

  async logRequest(
    routeId: string,
    routePath: string,
    method: string,
    status: RequestStatus,
    statusCode: number,
    responseTime: number,
    userId?: string,
    ipAddress?: string,
    errorMessage?: string,
  ): Promise<ApiRequestLog> {
    const log = this.requestLogRepository.create({
      routeId,
      routePath,
      method,
      userId,
      ipAddress,
      status,
      statusCode,
      responseTime,
      errorMessage,
      requestDate: new Date(),
    });

    const saved = await this.requestLogRepository.save(log);

    // Update route statistics
    const route = await this.routeRepository.findOne({ where: { id: routeId } });
    if (route) {
      route.requestCount += 1;
      if (status === RequestStatus.SUCCESS) {
        route.successCount += 1;
      } else {
        route.errorCount += 1;
      }

      // Update average response time (simple moving average)
      const totalTime = route.averageResponseTime * (route.requestCount - 1) + responseTime;
      route.averageResponseTime = totalTime / route.requestCount;

      await this.routeRepository.save(route);
    }

    return saved;
  }

  async getGatewayStats(): Promise<ApiGatewayStats> {
    const routes = await this.routeRepository.find({ where: { isActive: true } });
    const totalRequests = routes.reduce((sum, r) => sum + r.requestCount, 0);

    // Get requests in last minute
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentRequests = await this.requestLogRepository.count({
      where: { requestDate: MoreThan(oneMinuteAgo) },
    });

    // Calculate average response time
    const totalResponseTime = routes.reduce((sum, r) => sum + r.averageResponseTime * r.requestCount, 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

    // Calculate error rate
    const totalErrors = routes.reduce((sum, r) => sum + r.errorCount, 0);
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    return {
      totalRequests,
      requestsPerMinute: recentRequests,
      averageResponseTime,
      errorRate,
      activeRoutes: routes.length,
    };
  }

  async getRouteStats(routeId: string): Promise<Record<string, any>> {
    const route = await this.findOneRoute(routeId);

    // Get recent requests
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentRequests = await this.requestLogRepository.count({
      where: {
        routeId,
        requestDate: MoreThan(oneHourAgo),
      },
    });

    return {
      routeId: route.id,
      routePath: route.routePath,
      totalRequests: route.requestCount,
      successCount: route.successCount,
      errorCount: route.errorCount,
      averageResponseTime: route.averageResponseTime,
      recentRequests,
      successRate: route.requestCount > 0 ? route.successCount / route.requestCount : 0,
    };
  }

  async getRequestLogs(
    routeId?: string,
    userId?: string,
    status?: RequestStatus,
    limit: number = 100,
  ): Promise<ApiRequestLog[]> {
    const where: any = {};
    if (routeId) where.routeId = routeId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    return this.requestLogRepository.find({
      where,
      order: { requestDate: 'DESC' },
      take: limit,
    });
  }

  async getRateLimitRules(): Promise<RateLimitRule[]> {
    return this.rateLimitRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }
}

