import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AutoDisbursementService } from './services/auto-disbursement.service';
import { AutoRepaymentCaptureService } from './services/auto-repayment-capture.service';
import { STPTrackingService } from './services/stp-tracking.service';
import { QueueManagementService } from './services/queue-management.service';
import {
  AutoDisbursementRequestDto,
  AutoDisbursementResultDto,
} from './dto/auto-disbursement.dto';
import {
  AutoRepaymentRequestDto,
  AutoRepaymentResultDto,
} from './dto/auto-repayment.dto';
import { STPMetricsDto, ManualReviewQueueItemDto } from './dto/stp-tracking.dto';

@ApiTags('Auto-Processing')
@ApiBearerAuth('JWT-auth')
@Controller('auto-processing')
export class AutoProcessingController {
  constructor(
    private readonly autoDisbursementService: AutoDisbursementService,
    private readonly autoRepaymentCaptureService: AutoRepaymentCaptureService,
    private readonly stpTrackingService: STPTrackingService,
    private readonly queueManagementService: QueueManagementService,
  ) {}

  // Auto-Disbursement Endpoints

  @Post('disbursement/trigger')
  @ApiOperation({ summary: 'Trigger auto-disbursement immediately upon approval' })
  @ApiResponse({ status: 201, description: 'Auto-disbursement triggered' })
  async triggerAutoDisbursement(
    @Body() dto: AutoDisbursementRequestDto,
    @Request() req: any,
  ): Promise<AutoDisbursementResultDto> {
    return await this.autoDisbursementService.triggerAutoDisbursement(
      dto,
      req.user?.companyId || '',
      new Date(),
    );
  }

  // Auto-Repayment Capture Endpoints

  @Post('repayment/capture')
  @ApiOperation({ summary: 'Capture auto-repayment' })
  @ApiResponse({ status: 201, description: 'Repayment captured' })
  async captureAutoRepayment(
    @Body() dto: AutoRepaymentRequestDto,
    @Request() req: any,
  ): Promise<AutoRepaymentResultDto> {
    return await this.autoRepaymentCaptureService.captureAutoRepayment(
      dto,
      req.user?.companyId || '',
    );
  }

  // STP Tracking Endpoints

  @Get('stp/metrics')
  @ApiOperation({ summary: 'Get STP metrics' })
  @ApiResponse({ status: 200, description: 'STP metrics retrieved' })
  async getSTPMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('segment') segment?: string,
    @Query('processingType') processingType?: string,
  ): Promise<STPMetricsDto> {
    return await this.stpTrackingService.calculateSTPRate(
      new Date(startDate),
      new Date(endDate),
      segment as any,
      processingType as any,
    );
  }

  @Get('stp/metrics/hourly')
  @ApiOperation({ summary: 'Get STP metrics by hour' })
  @ApiResponse({ status: 200, description: 'Hourly STP metrics retrieved' })
  async getSTPMetricsByHour(
    @Query('date') date: string,
    @Query('segment') segment?: string,
  ): Promise<STPMetricsDto[]> {
    return await this.stpTrackingService.getSTPMetricsByHour(
      new Date(date),
      segment as any,
    );
  }

  @Get('stp/metrics/daily')
  @ApiOperation({ summary: 'Get STP metrics by day' })
  @ApiResponse({ status: 200, description: 'Daily STP metrics retrieved' })
  async getSTPMetricsByDay(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('segment') segment?: string,
  ): Promise<STPMetricsDto[]> {
    return await this.stpTrackingService.getSTPMetricsByDay(
      new Date(startDate),
      new Date(endDate),
      segment as any,
    );
  }

  @Get('stp/targets')
  @ApiOperation({ summary: 'Check STP targets by segment' })
  @ApiResponse({ status: 200, description: 'STP targets checked' })
  async checkSTPTargets(@Query('segment') segment: string) {
    return await this.stpTrackingService.checkSTPTarget(segment as any);
  }

  // Queue Management Endpoints

  @Get('queue/items')
  @ApiOperation({ summary: 'Get manual review queue items' })
  @ApiResponse({ status: 200, description: 'Queue items retrieved' })
  async getQueueItems(
    @Query('limit') limit?: number,
    @Query('assignedTo') assignedTo?: string,
  ): Promise<ManualReviewQueueItemDto[]> {
    return await this.stpTrackingService.getQueueItems(limit, assignedTo);
  }

  @Post('queue/assign/:queueItemId')
  @ApiOperation({ summary: 'Assign queue item to reviewer' })
  @ApiResponse({ status: 200, description: 'Queue item assigned' })
  async assignQueueItem(
    @Param('queueItemId') queueItemId: string,
    @Body() body: { reviewerId: string },
  ) {
    return await this.stpTrackingService.assignQueueItem(
      queueItemId,
      body.reviewerId,
    );
  }

  @Post('queue/complete/:queueItemId')
  @ApiOperation({ summary: 'Complete queue item review' })
  @ApiResponse({ status: 200, description: 'Queue item completed' })
  async completeQueueItem(@Param('queueItemId') queueItemId: string) {
    return await this.stpTrackingService.completeQueueItem(queueItemId);
  }

  @Get('queue/dashboard')
  @ApiOperation({ summary: 'Get queue dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getQueueDashboard() {
    return await this.queueManagementService.getQueueDashboard();
  }

  @Get('queue/sla')
  @ApiOperation({ summary: 'Get SLA metrics for manual reviews' })
  @ApiResponse({ status: 200, description: 'SLA metrics retrieved' })
  async getSLAMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.queueManagementService.calculateSLAMetrics(
      new Date(startDate),
      new Date(endDate),
    );
  }
}

