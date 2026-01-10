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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './services/dashboard.service';
import { AnalyticsService } from './services/analytics.service';
import {
  CreateDashboardDto,
  UpdateDashboardDto,
  CreateWidgetDto,
  UpdateWidgetDto,
  GetMetricsDto,
} from './dto/dashboard.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Get real-time metrics
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get real-time analytics metrics' })
  async getMetrics(@Query() filters: GetMetricsDto) {
    return await this.analyticsService.getMetrics(filters);
  }

  /**
   * Get time-series data for charts
   */
  @Get('time-series/:metricId')
  @ApiOperation({ summary: 'Get time-series data for a specific metric' })
  async getTimeSeries(
    @Param('metricId') metricId: string,
    @Query() filters: GetMetricsDto,
    @Query('interval') interval: 'day' | 'week' | 'month' = 'day',
  ) {
    return await this.analyticsService.getTimeSeriesData(metricId, filters, interval);
  }

  /**
   * Get comparative analysis (YoY, MoM, etc.)
   */
  @Get('comparison/:metricId')
  @ApiOperation({ summary: 'Get comparative analysis for a metric (YoY, MoM)' })
  async getComparison(
    @Param('metricId') metricId: string,
    @Query() filters: GetMetricsDto,
    @Query('compareType') compareType: 'yoy' | 'mom' | 'qoq' = 'mom',
    @Query('interval') interval: 'day' | 'week' | 'month' = 'day',
  ) {
    return await this.analyticsService.getComparativeAnalysis(metricId, filters, compareType, interval);
  }

  /**
   * Get all dashboards for current user
   */
  @Get('dashboards')
  @ApiOperation({ summary: 'Get all dashboards for current user' })
  async getDashboards(@Request() req: any, @Query('companyId') companyId?: string) {
    return await this.dashboardService.findAll(req.user.id, companyId);
  }

  /**
   * Get default dashboard
   */
  @Get('dashboards/default')
  @ApiOperation({ summary: 'Get default dashboard for current user' })
  async getDefaultDashboard(@Request() req: any) {
    return await this.dashboardService.findDefault(req.user.id);
  }

  /**
   * Get a single dashboard
   */
  @Get('dashboards/:id')
  @ApiOperation({ summary: 'Get a single dashboard' })
  async getDashboard(@Param('id') id: string) {
    return await this.dashboardService.findOne(id);
  }

  /**
   * Create a new dashboard
   */
  @Post('dashboards')
  @ApiOperation({ summary: 'Create a new dashboard' })
  async createDashboard(@Request() req: any, @Body() createDto: CreateDashboardDto) {
    return await this.dashboardService.create(req.user.id, createDto);
  }

  /**
   * Update a dashboard
   */
  @Put('dashboards/:id')
  @ApiOperation({ summary: 'Update a dashboard' })
  async updateDashboard(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateDto: UpdateDashboardDto,
  ) {
    return await this.dashboardService.update(id, req.user.id, updateDto);
  }

  /**
   * Delete a dashboard
   */
  @Delete('dashboards/:id')
  @ApiOperation({ summary: 'Delete a dashboard' })
  async deleteDashboard(@Param('id') id: string, @Request() req: any) {
    await this.dashboardService.remove(id, req.user.id);
    return { message: 'Dashboard deleted successfully' };
  }

  /**
   * Add widget to dashboard
   */
  @Post('dashboards/:dashboardId/widgets')
  @ApiOperation({ summary: 'Add widget to dashboard' })
  async addWidget(
    @Param('dashboardId') dashboardId: string,
    @Body() createDto: CreateWidgetDto,
  ) {
    return await this.dashboardService.addWidget(dashboardId, createDto);
  }

  /**
   * Update widget
   */
  @Put('dashboards/:dashboardId/widgets/:widgetId')
  @ApiOperation({ summary: 'Update widget' })
  async updateWidget(
    @Param('dashboardId') dashboardId: string,
    @Param('widgetId') widgetId: string,
    @Body() updateDto: UpdateWidgetDto,
  ) {
    return await this.dashboardService.updateWidget(dashboardId, widgetId, updateDto);
  }

  /**
   * Remove widget from dashboard
   */
  @Delete('dashboards/:dashboardId/widgets/:widgetId')
  @ApiOperation({ summary: 'Remove widget from dashboard' })
  async removeWidget(
    @Param('dashboardId') dashboardId: string,
    @Param('widgetId') widgetId: string,
  ) {
    await this.dashboardService.removeWidget(dashboardId, widgetId);
    return { message: 'Widget removed successfully' };
  }
}

