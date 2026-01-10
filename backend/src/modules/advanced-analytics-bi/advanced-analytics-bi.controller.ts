import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdvancedAnalyticsBIService } from './services/advanced-analytics-bi.service';
import {
  CreateCustomReportDto,
  CreateDashboardDto,
  CreateVisualizationDto,
  ReportType,
  ReportStatus,
} from './dto/advanced-analytics-bi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Advanced Analytics & BI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('advanced-analytics-bi')
export class AdvancedAnalyticsBIController {
  constructor(private readonly analyticsBIService: AdvancedAnalyticsBIService) {}

  @Post('reports')
  @ApiOperation({ summary: 'Create custom report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  createCustomReport(
    @Request() req: any,
    @Body() createDto: CreateCustomReportDto,
  ) {
    return this.analyticsBIService.createCustomReport(createDto, req.user.id);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get all custom reports' })
  @ApiResponse({ status: 200, description: 'List of reports' })
  findAllReports(
    @Query('reportType') reportType?: ReportType,
    @Query('status') status?: ReportStatus,
  ) {
    return this.analyticsBIService.findAllReports(reportType, status);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get custom report by ID' })
  @ApiResponse({ status: 200, description: 'Report details' })
  findOneReport(@Param('id') id: string) {
    return this.analyticsBIService.findOneReport(id);
  }

  @Post('reports/:id/execute')
  @ApiOperation({ summary: 'Execute custom report' })
  @ApiResponse({ status: 200, description: 'Report executed successfully' })
  executeReport(
    @Param('id') id: string,
    @Body('parameters') parameters?: Record<string, any>,
  ) {
    return this.analyticsBIService.executeReport(id, parameters);
  }

  @Post('dashboards')
  @ApiOperation({ summary: 'Create dashboard' })
  @ApiResponse({ status: 201, description: 'Dashboard created successfully' })
  createDashboard(
    @Request() req: any,
    @Body() createDto: CreateDashboardDto,
  ) {
    return this.analyticsBIService.createDashboard(createDto, req.user.id);
  }

  @Get('dashboards')
  @ApiOperation({ summary: 'Get all dashboards' })
  @ApiResponse({ status: 200, description: 'List of dashboards' })
  findAllDashboards(
    @Query('isPublic') isPublic?: boolean,
    @Request() req?: any,
  ) {
    return this.analyticsBIService.findAllDashboards(
      isPublic !== undefined ? isPublic === true : undefined,
      req?.user?.id,
    );
  }

  @Get('dashboards/:id')
  @ApiOperation({ summary: 'Get dashboard by ID' })
  @ApiResponse({ status: 200, description: 'Dashboard details' })
  findOneDashboard(@Param('id') id: string) {
    return this.analyticsBIService.findOneDashboard(id);
  }

  @Post('visualizations')
  @ApiOperation({ summary: 'Create data visualization' })
  @ApiResponse({ status: 201, description: 'Visualization created successfully' })
  createVisualization(
    @Request() req: any,
    @Body() createDto: CreateVisualizationDto,
  ) {
    return this.analyticsBIService.createVisualization(createDto, req.user.id);
  }

  @Get('visualizations')
  @ApiOperation({ summary: 'Get all visualizations' })
  @ApiResponse({ status: 200, description: 'List of visualizations' })
  findAllVisualizations() {
    return this.analyticsBIService.findAllVisualizations();
  }

  @Post('insights/generate')
  @ApiOperation({ summary: 'Generate data insights' })
  @ApiResponse({ status: 200, description: 'Insights generated successfully' })
  generateInsights() {
    return this.analyticsBIService.generateInsights();
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get data insights' })
  @ApiResponse({ status: 200, description: 'List of insights' })
  getInsights(
    @Query('insightType') insightType?: string,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsBIService.getInsights(insightType, limit);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get analytics summary' })
  @ApiResponse({ status: 200, description: 'Analytics summary' })
  getAnalyticsSummary() {
    return this.analyticsBIService.getAnalyticsSummary();
  }
}

