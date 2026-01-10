import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FastDecisionService } from './services/fast-decision.service';
import {
  InitiateFastDecisionDto,
  FastDecisionResultDto,
  DecisionProgressDto,
} from './dto/fast-decision.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Fast Decision')
@Controller('fast-decision')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FastDecisionController {
  constructor(private readonly fastDecisionService: FastDecisionService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate fast decision process',
    description: `
      Initiates a fast decision process for a loan application with SLA tracking.
      Target: 95% of applications processed in under 10 minutes.
      
      Component SLAs:
      - Document verification: <30s
      - KYC/AML: <45s
      - Scoring: <2s
      - Approval: <15s
      
      Real-time progress notifications are sent via WebSocket, Push, and SMS.
    `,
  })
  @ApiResponse({ status: 200, description: 'Fast decision initiated', type: DecisionProgressDto })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async initiateFastDecision(
    @Body() dto: InitiateFastDecisionDto,
    @Request() req: any,
  ): Promise<DecisionProgressDto> {
    return this.fastDecisionService.initiateFastDecision(
      dto,
      req.user.companyId,
      req.user.id,
    );
  }

  @Get('progress/:applicationId')
  @ApiOperation({
    summary: 'Get decision progress',
    description: 'Get real-time progress of fast decision process',
  })
  @ApiResponse({ status: 200, description: 'Progress retrieved', type: DecisionProgressDto })
  async getProgress(
    @Param('applicationId') applicationId: string,
  ): Promise<DecisionProgressDto | null> {
    return this.fastDecisionService.getProgress(applicationId);
  }

  @Get('result/:applicationId')
  @ApiOperation({
    summary: 'Get decision result',
    description: 'Get final decision result after processing completes',
  })
  @ApiResponse({ status: 200, description: 'Result retrieved', type: FastDecisionResultDto })
  async getResult(
    @Param('applicationId') applicationId: string,
  ): Promise<FastDecisionResultDto | null> {
    return this.fastDecisionService.getDecisionResult(applicationId);
  }

  @Get('sla-statistics')
  @ApiOperation({
    summary: 'Get SLA statistics',
    description: 'Get SLA compliance statistics and performance metrics',
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getSLAStatistics(
    @Request() req: any,
  ): Promise<{
    total: number;
    slaCompliant: number;
    slaViolated: number;
    averageTime: number;
    p95Time: number;
    stepStatistics: Record<string, any>;
  }> {
    return this.fastDecisionService.getSLAStatistics();
  }
}

