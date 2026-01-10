import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { IntegrationService } from './services/integration.service';
import { CreateThirdPartyPlatformDto } from './dto/create-platform.dto';
import { UpdateThirdPartyPlatformDto } from './dto/update-platform.dto';
import { TestWebhookDto } from './dto/test-webhook.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Integration Admin')
@ApiBearerAuth()
@Controller('admin/integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'System Administrator', 'admin', 'system_administrator')
export class IntegrationAdminController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post('platforms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create third-party platform',
    description: 'Creates a new third-party platform integration with auto-generated API keys',
  })
  @ApiBody({ type: CreateThirdPartyPlatformDto })
  @ApiResponse({ status: 201, description: 'Platform created successfully' })
  @ApiResponse({ status: 409, description: 'Platform code already exists' })
  async createPlatform(@Body() dto: CreateThirdPartyPlatformDto, @Request() req: any) {
    return this.integrationService.createPlatform(dto, req.user.id);
  }

  @Get('platforms')
  @ApiOperation({
    summary: 'Get all platforms',
    description: 'Retrieves all third-party platforms',
  })
  @ApiResponse({ status: 200, description: 'Platforms retrieved successfully' })
  async getAllPlatforms() {
    return this.integrationService.getAllPlatforms();
  }

  @Get('platforms/:id')
  @ApiOperation({
    summary: 'Get platform by ID',
    description: 'Retrieves a specific platform with its details',
  })
  @ApiParam({ name: 'id', description: 'Platform ID' })
  @ApiResponse({ status: 200, description: 'Platform found' })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async getPlatformById(@Param('id') id: string) {
    return this.integrationService.getPlatformById(id);
  }

  @Put('platforms/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update platform',
    description: 'Updates platform configuration',
  })
  @ApiParam({ name: 'id', description: 'Platform ID' })
  @ApiBody({ type: UpdateThirdPartyPlatformDto })
  @ApiResponse({ status: 200, description: 'Platform updated successfully' })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async updatePlatform(
    @Param('id') id: string,
    @Body() dto: UpdateThirdPartyPlatformDto,
    @Request() req: any,
  ) {
    return this.integrationService.updatePlatform(id, dto, req.user.id);
  }

  @Post('platforms/:id/regenerate-api-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Regenerate API key',
    description: 'Generates new API key and secret for the platform',
  })
  @ApiParam({ name: 'id', description: 'Platform ID' })
  @ApiResponse({ status: 200, description: 'API key regenerated successfully' })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async regenerateApiKey(@Param('id') id: string, @Request() req: any) {
    return this.integrationService.regenerateApiKey(id, req.user.id);
  }

  @Post('platforms/:id/regenerate-webhook-secret')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Regenerate webhook secret',
    description: 'Generates new webhook secret for the platform',
  })
  @ApiParam({ name: 'id', description: 'Platform ID' })
  @ApiResponse({ status: 200, description: 'Webhook secret regenerated successfully' })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async regenerateWebhookSecret(@Param('id') id: string, @Request() req: any) {
    return this.integrationService.regenerateWebhookSecret(id, req.user.id);
  }

  @Get('platforms/:id/statistics')
  @ApiOperation({
    summary: 'Get platform statistics',
    description: 'Retrieves statistics for a platform (applications, repayments, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Platform ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async getPlatformStatistics(@Param('id') id: string) {
    return this.integrationService.getPlatformStatistics(id);
  }

  @Delete('platforms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete platform',
    description: 'Deletes a platform (only if no applications exist)',
  })
  @ApiParam({ name: 'id', description: 'Platform ID' })
  @ApiResponse({ status: 204, description: 'Platform deleted successfully' })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete platform with active applications' })
  async deletePlatform(@Param('id') id: string, @Request() req: any) {
    await this.integrationService.deletePlatform(id, req.user.id);
  }

  @Post('platforms/:id/test-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test webhook',
    description: 'Sends a test webhook to the platform',
  })
  @ApiParam({ name: 'id', description: 'Platform ID' })
  @ApiBody({ type: TestWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook test completed' })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  @ApiResponse({ status: 400, description: 'Webhook URL not configured' })
  async testWebhook(@Param('id') id: string, @Body() dto: TestWebhookDto) {
    return this.integrationService.testWebhook(id, dto);
  }

  @Get('platforms/:id/webhooks')
  @ApiOperation({
    summary: 'Get webhook delivery history',
    description: 'Retrieves webhook delivery history for a platform',
  })
  @ApiParam({ name: 'id', description: 'Platform ID' })
  @ApiResponse({ status: 200, description: 'Webhook deliveries retrieved successfully' })
  async getWebhookDeliveries(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.integrationService.getWebhookDeliveries(
      id,
      status as any,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('platforms/:id/health')
  @ApiOperation({
    summary: 'Get integration health status',
    description: 'Retrieves health status and metrics for a platform',
  })
  @ApiParam({ name: 'id', description: 'Platform ID' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getIntegrationHealth(@Param('id') id: string) {
    return this.integrationService.getIntegrationHealth(id);
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get integration analytics',
    description: 'Retrieves analytics data for all platforms or a specific platform',
  })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getIntegrationAnalytics(
    @Query('platformId') platformId?: string,
    @Query('days') days?: string,
  ) {
    return this.integrationService.getIntegrationAnalytics(
      platformId,
      days ? parseInt(days) : 30,
    );
  }

  @Get('audit-logs')
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieves audit logs for platform actions',
  })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @Query('platformId') platformId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.integrationService.getAuditLogs(
      platformId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }
}

