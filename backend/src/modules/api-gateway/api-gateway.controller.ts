import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiGatewayService } from './services/api-gateway.service';
import {
  CreateApiRouteDto,
  CreateRateLimitRuleDto,
} from './dto/api-gateway.dto';
import { RequestStatus } from './entities/api-request-log.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('API Gateway')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-gateway')
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Post('routes')
  @ApiOperation({ summary: 'Create API route' })
  @ApiResponse({ status: 201, description: 'Route created successfully' })
  createRoute(@Body() createDto: CreateApiRouteDto) {
    return this.apiGatewayService.createRoute(createDto);
  }

  @Get('routes')
  @ApiOperation({ summary: 'Get all API routes' })
  @ApiResponse({ status: 200, description: 'List of routes' })
  findAllRoutes(@Query('isActive') isActive?: boolean) {
    return this.apiGatewayService.findAllRoutes(
      isActive !== undefined ? isActive === true : undefined,
    );
  }

  @Get('routes/:id')
  @ApiOperation({ summary: 'Get API route by ID' })
  @ApiResponse({ status: 200, description: 'Route details' })
  findOneRoute(@Param('id') id: string) {
    return this.apiGatewayService.findOneRoute(id);
  }

  @Get('routes/:id/stats')
  @ApiOperation({ summary: 'Get route statistics' })
  @ApiResponse({ status: 200, description: 'Route statistics' })
  getRouteStats(@Param('id') id: string) {
    return this.apiGatewayService.getRouteStats(id);
  }

  @Post('rate-limits')
  @ApiOperation({ summary: 'Create rate limit rule' })
  @ApiResponse({ status: 201, description: 'Rate limit rule created' })
  createRateLimitRule(@Body() createDto: CreateRateLimitRuleDto) {
    return this.apiGatewayService.createRateLimitRule(createDto);
  }

  @Get('rate-limits')
  @ApiOperation({ summary: 'Get rate limit rules' })
  @ApiResponse({ status: 200, description: 'List of rate limit rules' })
  getRateLimitRules() {
    return this.apiGatewayService.getRateLimitRules();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get API gateway statistics' })
  @ApiResponse({ status: 200, description: 'Gateway statistics' })
  getGatewayStats() {
    return this.apiGatewayService.getGatewayStats();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get request logs' })
  @ApiResponse({ status: 200, description: 'List of request logs' })
  getRequestLogs(
    @Query('routeId') routeId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: RequestStatus,
    @Query('limit') limit?: number,
  ) {
    return this.apiGatewayService.getRequestLogs(routeId, userId, status, limit);
  }
}

