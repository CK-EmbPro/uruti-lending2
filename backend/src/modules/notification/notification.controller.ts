import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './services/notification.service';
import { NotificationTemplateService } from './services/notification-template.service';
import { NotificationPreferenceService } from './services/notification-preference.service';
import { CreateNotificationDto, BulkNotificationDto } from './dto/create-notification.dto';
import { CreateNotificationTemplateDto, UpdateNotificationTemplateDto } from './dto/notification-template.dto';
import {
  CreateNotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
  QueryNotificationPreferencesDto,
} from './dto/notification-preference.dto';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../common/enums/notification-channel.enum';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly templateService: NotificationTemplateService,
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  // Notification sending endpoints
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a notification' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async sendNotification(@Body() dto: CreateNotificationDto, @Request() req: any) {
    return this.notificationService.sendNotification(dto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send bulk notifications' })
  @ApiResponse({ status: 201, description: 'Bulk notifications sent successfully' })
  async sendBulkNotification(@Body() dto: BulkNotificationDto) {
    return this.notificationService.sendBulkNotification(dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'User notifications retrieved successfully' })
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationService.getUserNotifications(
      userId,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.notificationService.getStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // Template management endpoints
  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create notification template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(@Body() dto: CreateNotificationTemplateDto, @Request() req: any) {
    return this.templateService.create(dto, req.user?.id);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all notification templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplates(
    @Query('notificationType') notificationType?: NotificationType,
    @Query('channel') channel?: NotificationChannel,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.templateService.findAll(
      notificationType,
      channel,
      isActive !== undefined ? isActive === true : undefined,
    );
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get notification template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  async getTemplate(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Put('templates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationTemplateDto,
    @Request() req: any,
  ) {
    return this.templateService.update(id, dto, req.user?.id);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification template' })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  async deleteTemplate(@Param('id') id: string) {
    await this.templateService.delete(id);
  }

  // Preference management endpoints
  @Post('preferences')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create notification preference' })
  @ApiResponse({ status: 201, description: 'Preference created successfully' })
  async createPreference(@Body() dto: CreateNotificationPreferenceDto) {
    return this.preferenceService.create(dto);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  async getPreferences(@Query() query: QueryNotificationPreferencesDto) {
    return this.preferenceService.findAll(query);
  }

  @Get('preferences/user/:userId')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'User preferences retrieved successfully' })
  async getUserPreferences(@Param('userId') userId: string) {
    return this.preferenceService.getUserPreferences(userId);
  }

  @Put('preferences/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification preference' })
  @ApiResponse({ status: 200, description: 'Preference updated successfully' })
  async updatePreference(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.preferenceService.update(id, dto);
  }

  @Post('preferences/user/:userId/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async bulkUpdatePreferences(
    @Param('userId') userId: string,
    @Body() preferences: Array<{ notificationType?: string | null; channel: string; enabled: boolean }>,
  ) {
    return this.preferenceService.bulkUpdate(userId, preferences);
  }

  @Delete('preferences/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification preference' })
  @ApiResponse({ status: 204, description: 'Preference deleted successfully' })
  async deletePreference(@Param('id') id: string) {
    await this.preferenceService.delete(id);
  }
}

