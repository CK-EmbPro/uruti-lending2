import {
  Controller,
  Post,
  Get,
  Put,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FraudDetectionService } from './services/fraud-detection.service';
import { IdentityDuplicationDetectionService } from './services/identity-duplication-detection.service';
import { DocumentForgeryDetectionService } from './services/document-forgery-detection.service';
import { BehavioralAnomalyDetectionService } from './services/behavioral-anomaly-detection.service';
import { FraudCheckRequestDto } from './dto/fraud-detection.dto';
import { DuplicateCheckRequestDto } from './dto/identity-duplication.dto';
import { DocumentForgeryCheckRequestDto } from './dto/document-forgery.dto';
import { BehavioralAnomalyCheckRequestDto } from './dto/behavioral-anomaly.dto';
import { NetworkFraudCheckRequestDto } from './dto/network-fraud.dto';
import { NetworkFraudDetectionService } from './services/network-fraud-detection.service';
import { FraudInvestigationCaseService } from './services/fraud-investigation-case.service';
import { CreateInvestigationCaseDto, UpdateInvestigationCaseDto } from './services/fraud-investigation-case.service';
import { FraudPerformanceMonitorService } from './services/fraud-performance-monitor.service';
import { FraudBatchAnalysisService } from './services/fraud-batch-analysis.service';
import { FraudModelRetrainingService } from './services/fraud-model-retraining.service';
import { InvestigationStatus, EscalationLevel } from './entities/fraud-investigation-case.entity';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('fraud-detection')
@ApiBearerAuth('JWT-auth')
@Controller('fraud-detection')
@UseGuards(CompanyGuard)
export class FraudDetectionController {
  constructor(
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly identityDuplicationService: IdentityDuplicationDetectionService,
    private readonly documentForgeryService: DocumentForgeryDetectionService,
    private readonly behavioralAnomalyService: BehavioralAnomalyDetectionService,
    private readonly networkFraudService: NetworkFraudDetectionService,
    private readonly investigationCaseService: FraudInvestigationCaseService,
    private readonly performanceMonitorService: FraudPerformanceMonitorService,
    private readonly batchAnalysisService: FraudBatchAnalysisService,
    private readonly modelRetrainingService: FraudModelRetrainingService,
  ) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check for fraud indicators',
    description: 'Analyzes application for fraud indicators including email, phone, IP address, device fingerprint, and application velocity. Returns risk score and recommendations.',
  })
  @ApiBody({ type: FraudCheckRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Fraud check completed successfully',
  })
  async checkFraud(
    @Body() dto: FraudCheckRequestDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.fraudDetectionService.checkFraud(dto, companyId);
  }

  @Post('identity-duplication/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check for identity duplication',
    description: 'Checks for duplicate identities across ID, phone, email, device, biometric, and bank account. Includes fuzzy name matching and suspicious pattern detection.',
  })
  @ApiBody({ type: DuplicateCheckRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Identity duplication check completed successfully',
  })
  async checkIdentityDuplication(
    @Body() dto: DuplicateCheckRequestDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.identityDuplicationService.checkDuplication(dto, companyId);
  }

  @Post('document-forgery/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check for document forgery',
    description: 'Performs comprehensive document forgery detection including font analysis, metadata extraction, image forensics, and template matching.',
  })
  @ApiBody({ type: DocumentForgeryCheckRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Document forgery check completed successfully',
  })
  async checkDocumentForgery(
    @Body() dto: DocumentForgeryCheckRequestDto,
    @Request() req: any,
  ) {
    return await this.documentForgeryService.checkDocumentForgery(dto);
  }

  @Post('behavioral-anomaly/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check for behavioral anomalies',
    description: 'Detects behavioral anomalies including speed, location, usage patterns, and multi-platform detection. Returns anomaly score (0-100) with review threshold >70.',
  })
  @ApiBody({ type: BehavioralAnomalyCheckRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Behavioral anomaly check completed successfully',
  })
  async checkBehavioralAnomaly(
    @Body() dto: BehavioralAnomalyCheckRequestDto,
    @Request() req: any,
  ) {
    return await this.behavioralAnomalyService.checkBehavioralAnomalies(dto);
  }

  @Post('network-fraud/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check for network fraud (fraud rings)',
    description: 'Detects fraud rings by building relationship graphs from shared attributes and identifying dense clusters. Returns network risk score and visualization data.',
  })
  @ApiBody({ type: NetworkFraudCheckRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Network fraud check completed successfully',
  })
  async checkNetworkFraud(
    @Body() dto: NetworkFraudCheckRequestDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.networkFraudService.checkNetworkFraud(dto, companyId);
  }

  @Get('network-fraud/visualization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get network graph visualization data',
    description: 'Returns network graph data for visualization including nodes, edges, and clusters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Visualization data retrieved successfully',
  })
  async getNetworkVisualization(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.networkFraudService.generateVisualization(companyId);
  }

  @Post('investigation-cases')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create investigation case',
    description: 'Creates a new fraud investigation case with SLA tracking and evidence collection.',
  })
  @ApiBody({ type: CreateInvestigationCaseDto })
  @ApiResponse({
    status: 201,
    description: 'Investigation case created successfully',
  })
  async createInvestigationCase(@Body() dto: CreateInvestigationCaseDto) {
    return await this.investigationCaseService.createCase(dto);
  }

  @Get('investigation-cases')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get investigation cases',
    description: 'Retrieves investigation cases with optional filters for status, escalation level, and assignment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Investigation cases retrieved successfully',
  })
  async getInvestigationCases(
    @Query('status') status?: InvestigationStatus,
    @Query('escalationLevel') escalationLevel?: EscalationLevel,
    @Query('assignedTo') assignedTo?: string,
    @Query('overdue') overdue?: boolean,
  ) {
    return await this.investigationCaseService.getCases({
      status,
      escalationLevel,
      assignedTo,
      overdue: overdue === true,
    });
  }

  @Get('investigation-cases/:caseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get investigation case by ID',
    description: 'Retrieves a specific investigation case with all evidence and findings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Investigation case retrieved successfully',
  })
  async getInvestigationCase(@Param('caseId') caseId: string) {
    return await this.investigationCaseService.getCase(caseId);
  }

  @Put('investigation-cases/:caseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update investigation case',
    description: 'Updates investigation case status, evidence, findings, or assignment.',
  })
  @ApiBody({ type: UpdateInvestigationCaseDto })
  @ApiResponse({
    status: 200,
    description: 'Investigation case updated successfully',
  })
  async updateInvestigationCase(
    @Param('caseId') caseId: string,
    @Body() dto: UpdateInvestigationCaseDto,
  ) {
    return await this.investigationCaseService.updateCase(caseId, dto);
  }

  @Post('investigation-cases/:caseId/evidence')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add evidence to investigation case',
    description: 'Adds screenshots, recordings, notes, or documents to investigation case.',
  })
  @ApiResponse({
    status: 200,
    description: 'Evidence added successfully',
  })
  async addEvidence(
    @Param('caseId') caseId: string,
    @Body() evidence: {
      screenshots?: string[];
      recordings?: string[];
      notes?: string[];
      documents?: string[];
    },
  ) {
    return await this.investigationCaseService.addEvidence(caseId, evidence);
  }

  @Post('investigation-cases/:caseId/escalate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Escalate investigation case',
    description: 'Escalates case to manager, legal, or law enforcement based on severity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Case escalated successfully',
  })
  async escalateCase(
    @Param('caseId') caseId: string,
    @Body('escalationLevel') escalationLevel: EscalationLevel,
  ) {
    return await this.investigationCaseService.escalateCase(caseId, escalationLevel);
  }

  @Get('investigation-cases/sla/compliance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get SLA compliance metrics',
    description: 'Calculates SLA compliance rate for investigations (90% target within 24 hours).',
  })
  @ApiResponse({
    status: 200,
    description: 'SLA compliance metrics retrieved successfully',
  })
  async getSLACompliance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return await this.investigationCaseService.calculateSLACompliance(start, end);
  }

  @Get('performance/dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get fraud detection performance dashboard',
    description: 'Returns performance metrics including response times, false positive rate, and SLA compliance.',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance dashboard data retrieved successfully',
  })
  async getPerformanceDashboard() {
    return await this.performanceMonitorService.getPerformanceDashboard();
  }

  @Post('batch-analysis/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger batch analysis manually',
    description: 'Manually triggers nightly batch analysis (normally runs at 5 AM).',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch analysis triggered successfully',
  })
  async triggerBatchAnalysis() {
    await this.batchAnalysisService.runNightlyAnalysis();
    return { message: 'Batch analysis completed successfully' };
  }

  @Post('model-retraining/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger model retraining manually',
    description: 'Manually triggers monthly model retraining (normally runs on 1st of month).',
  })
  @ApiResponse({
    status: 200,
    description: 'Model retraining triggered successfully',
  })
  async triggerModelRetraining() {
    await this.modelRetrainingService.triggerRetraining();
    return { message: 'Model retraining completed successfully' };
  }
}

