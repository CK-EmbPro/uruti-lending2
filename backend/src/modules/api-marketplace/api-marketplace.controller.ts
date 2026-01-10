import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { APIMarketplaceService } from './services/api-marketplace.service';
import {
  CreateAPIKeyDto,
  CreateWebhookDto,
} from './dto/api-marketplace.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('api-marketplace')
@ApiBearerAuth('JWT-auth')
@Controller('api-marketplace')
@UseGuards(CompanyGuard)
export class APIMarketplaceController {
  constructor(private readonly marketplaceService: APIMarketplaceService) {}

  @Post('api-keys')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create API key',
    description: 'Creates a new API key for programmatic access. Returns the API key (only shown once). Supports rate limiting and IP restrictions.',
  })
  @ApiBody({ type: CreateAPIKeyDto })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully',
  })
  async createAPIKey(
    @Body() dto: CreateAPIKeyDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.marketplaceService.createAPIKey(dto, companyId);
  }

  @Get('api-keys')
  @ApiOperation({
    summary: 'Get API keys',
    description: 'Returns all API keys for the company. API keys are not shown for security.',
  })
  @ApiResponse({
    status: 200,
    description: 'API keys retrieved successfully',
  })
  async getAPIKeys(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.marketplaceService.getAPIKeys(companyId);
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke API key',
    description: 'Revokes an API key, preventing further use.',
  })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({
    status: 200,
    description: 'API key revoked successfully',
  })
  async revokeAPIKey(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.marketplaceService.revokeAPIKey(id, companyId);
    return { message: 'API key revoked successfully' };
  }

  @Post('webhooks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create webhook',
    description: 'Creates a new webhook subscription for receiving real-time events. Supports multiple events and HMAC signature verification.',
  })
  @ApiBody({ type: CreateWebhookDto })
  @ApiResponse({
    status: 201,
    description: 'Webhook created successfully',
  })
  async createWebhook(
    @Body() dto: CreateWebhookDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.marketplaceService.createWebhook(dto, companyId);
  }

  @Get('webhooks')
  @ApiOperation({
    summary: 'Get webhooks',
    description: 'Returns all webhook subscriptions for the company.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhooks retrieved successfully',
  })
  async getWebhooks(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.marketplaceService.getWebhooks(companyId);
  }

  @Get('webhooks/:id/deliveries')
  @ApiOperation({
    summary: 'Get webhook deliveries',
    description: 'Returns delivery history for a webhook including success/failure status and response times.',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of deliveries', example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Webhook deliveries retrieved successfully',
  })
  async getWebhookDeliveries(
    @Param('id') id: string,
    @Query('limit') limit: number,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.marketplaceService.getWebhookDeliveries(id, companyId, limit || 50);
  }

  @Get('usage-stats')
  @ApiOperation({
    summary: 'Get API usage statistics',
    description: 'Returns API usage statistics including total calls, success rates, response times, and usage by endpoint.',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({
    status: 200,
    description: 'API usage statistics retrieved successfully',
  })
  async getAPIUsageStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.marketplaceService.getAPIUsageStats(
      companyId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}

