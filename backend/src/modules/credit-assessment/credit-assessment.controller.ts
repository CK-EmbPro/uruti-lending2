import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreditScoringService } from './services/credit-scoring.service';
import { UnderwritingService } from './services/underwriting.service';
import { DecisionOverrideService } from './services/decision-override.service';
import { OverrideApprovalService } from './services/override-approval.service';
import { OverrideAuditService } from './services/override-audit.service';
import { OverridePerformanceService } from './services/override-performance.service';
import { ApproveOverrideDto, RejectOverrideDto } from './dto/override-approval.dto';
import { FraudDetectionService } from './services/fraud-detection.service';
import { AdvancedFraudDetectionService } from './services/advanced-fraud-detection.service';
import { AdverseActionService } from './services/adverse-action.service';
import { AutoApprovalService } from './services/auto-approval.service';
import { CreateUnderwritingReviewDto, UpdateUnderwritingReviewDto } from './dto/underwriting-review.dto';
import { OverrideDecisionDto } from './dto/credit-decision.dto';
import { UpdateFraudAlertDto } from './dto/fraud-alert.dto';
import { CalculateFraudScoreDto, CreateFraudCaseDto, FraudAnalyticsFiltersDto } from './dto/fraud-score.dto';
import { CreateAdverseActionNoticeDto, UpdateAdverseActionNoticeDto } from './dto/adverse-action-notice.dto';
import { AutoApprovalRequestDto } from './dto/auto-approval.dto';

@ApiTags('Credit Assessment & Decisioning')
@ApiBearerAuth('JWT-auth')
@Controller('credit-assessment')
export class CreditAssessmentController {
  constructor(
    private readonly creditScoringService: CreditScoringService,
    private readonly underwritingService: UnderwritingService,
    private readonly decisionOverrideService: DecisionOverrideService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly advancedFraudDetectionService: AdvancedFraudDetectionService,
    private readonly adverseActionService: AdverseActionService,
    private readonly overrideApprovalService: OverrideApprovalService,
    private readonly overrideAuditService: OverrideAuditService,
    private readonly overridePerformanceService: OverridePerformanceService,
    private readonly autoApprovalService: AutoApprovalService,
  ) {}

  // UC-006: Automated Credit Decision
  @Post('applications/:applicationId/credit-decision')
  @ApiOperation({ summary: 'Perform automated credit decision (UC-006)' })
  @ApiResponse({ status: 201, description: 'Credit decision created' })
  async performCreditDecision(@Param('applicationId') applicationId: string) {
    return await this.creditScoringService.performCreditDecision(applicationId);
  }

  @Get('applications/:applicationId/credit-decision')
  @ApiOperation({ summary: 'Get credit decision for application' })
  @ApiResponse({ status: 200, description: 'Credit decision retrieved' })
  async getCreditDecision(@Param('applicationId') applicationId: string) {
    return await this.creditScoringService.getCreditDecision(applicationId);
  }

  @Get('credit-decisions')
  @ApiOperation({ summary: 'Get all credit decisions' })
  @ApiResponse({ status: 200, description: 'Credit decisions retrieved' })
  async getAllCreditDecisions() {
    return await this.creditScoringService.getAllCreditDecisions();
  }

  // UC-007: Manual Underwriting Review
  @Post('applications/:applicationId/underwriting-review')
  @ApiOperation({ summary: 'Route application to underwriter (UC-007)' })
  @ApiResponse({ status: 201, description: 'Application routed to underwriter' })
  async routeToUnderwriter(
    @Param('applicationId') applicationId: string,
    @Body() createDto: CreateUnderwritingReviewDto,
    @Request() req: any,
  ) {
    return await this.underwritingService.routeToUnderwriter(
      applicationId,
      createDto.reviewerId || req.user.id,
      createDto.priority,
    );
  }

  @Put('underwriting-reviews/:reviewId/start')
  @ApiOperation({ summary: 'Start underwriting review' })
  @ApiResponse({ status: 200, description: 'Review started' })
  async startReview(@Param('reviewId') reviewId: string, @Request() req: any) {
    return await this.underwritingService.startReview(reviewId, req.user.id);
  }

  @Put('underwriting-reviews/:reviewId')
  @ApiOperation({ summary: 'Update underwriting review' })
  @ApiResponse({ status: 200, description: 'Review updated' })
  async updateReview(@Param('reviewId') reviewId: string, @Body() updateDto: UpdateUnderwritingReviewDto) {
    return await this.underwritingService.updateReview(reviewId, updateDto);
  }

  @Post('underwriting-reviews/:reviewId/complete')
  @ApiOperation({ summary: 'Complete underwriting review and make decision' })
  @ApiResponse({ status: 200, description: 'Review completed' })
  async completeReview(
    @Param('reviewId') reviewId: string,
    @Body()
    body: {
      decision: 'Approve' | 'Conditionally Approve' | 'Decline';
      rationale: string;
      approvedAmount?: number;
      approvedInterestRate?: number;
      approvedTerm?: number;
      conditions?: string;
    },
  ) {
    return await this.underwritingService.completeReview(
      reviewId,
      body.decision,
      body.rationale,
      body.approvedAmount,
      body.approvedInterestRate,
      body.approvedTerm,
      body.conditions,
    );
  }

  @Put('underwriting-reviews/:reviewId/escalate')
  @ApiOperation({ summary: 'Escalate review to senior underwriter' })
  @ApiResponse({ status: 200, description: 'Review escalated' })
  async escalateReview(
    @Param('reviewId') reviewId: string,
    @Body() body: { escalatedTo: string; reason: string },
  ) {
    return await this.underwritingService.escalateReview(reviewId, body.escalatedTo, body.reason);
  }

  @Put('underwriting-reviews/:reviewId/peer-review')
  @ApiOperation({ summary: 'Request peer review' })
  @ApiResponse({ status: 200, description: 'Peer review requested' })
  async requestPeerReview(
    @Param('reviewId') reviewId: string,
    @Body() body: { peerReviewerId: string },
  ) {
    return await this.underwritingService.requestPeerReview(reviewId, body.peerReviewerId);
  }

  @Get('underwriting-reviews/:reviewId')
  @ApiOperation({ summary: 'Get underwriting review' })
  @ApiResponse({ status: 200, description: 'Review retrieved' })
  async getReview(@Param('reviewId') reviewId: string) {
    return await this.underwritingService.getReview(reviewId);
  }

  @Get('applications/:applicationId/underwriting-reviews')
  @ApiOperation({ summary: 'Get reviews for application' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  async getReviewsForApplication(@Param('applicationId') applicationId: string) {
    return await this.underwritingService.getReviewsForApplication(applicationId);
  }

  @Get('underwriters/:reviewerId/reviews')
  @ApiOperation({ summary: 'Get reviews assigned to reviewer' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  async getReviewsForReviewer(@Param('reviewerId') reviewerId: string) {
    return await this.underwritingService.getReviewsForReviewer(reviewerId);
  }

  // UC-008: Credit Decision Override
  @Post('applications/:applicationId/override')
  @ApiOperation({ summary: 'Override declined application decision (UC-008)' })
  @ApiResponse({ status: 201, description: 'Decision overridden' })
  async overrideDecision(
    @Param('applicationId') applicationId: string,
    @Body() overrideDto: OverrideDecisionDto,
    @Request() req: any,
  ) {
    return await this.decisionOverrideService.overrideDecision(
      applicationId,
      overrideDto,
      req.user.id,
      req.user.roles || [],
    );
  }

  @Get('applications/:applicationId/override-history')
  @ApiOperation({ summary: 'Get override history for application' })
  @ApiResponse({ status: 200, description: 'Override history retrieved' })
  async getOverrideHistory(@Param('applicationId') applicationId: string) {
    return await this.decisionOverrideService.getOverrideHistory(applicationId);
  }

  @Get('overrides')
  @ApiOperation({ summary: 'Get all overrides (for compliance)' })
  @ApiResponse({ status: 200, description: 'Overrides retrieved' })
  async getAllOverrides() {
    return await this.decisionOverrideService.getAllOverrides();
  }

  // Dual Authorization Endpoints

  @Post('override-approvals/:approvalId/approve-first')
  @ApiOperation({ summary: 'First approver approves override' })
  @ApiParam({ name: 'approvalId', description: 'Override approval ID' })
  @ApiResponse({ status: 200, description: 'First approval completed' })
  async approveFirst(
    @Param('approvalId') approvalId: string,
    @Body() dto: ApproveOverrideDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.userId;
    return await this.overrideApprovalService.approveFirst(approvalId, userId, dto.comment);
  }

  @Post('override-approvals/:approvalId/approve-second')
  @ApiOperation({ summary: 'Second approver approves override' })
  @ApiParam({ name: 'approvalId', description: 'Override approval ID' })
  @ApiResponse({ status: 200, description: 'Second approval completed' })
  async approveSecond(
    @Param('approvalId') approvalId: string,
    @Body() dto: ApproveOverrideDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.userId;
    const userName = req.user?.name || req.userName || '';
    const userRole = req.user?.roles?.[0] || '';
    return await this.overrideApprovalService.approveSecond(approvalId, userId, userName, userRole, dto.comment);
  }

  @Post('override-approvals/:approvalId/reject')
  @ApiOperation({ summary: 'Reject override approval' })
  @ApiParam({ name: 'approvalId', description: 'Override approval ID' })
  @ApiResponse({ status: 200, description: 'Override rejected' })
  async rejectOverride(
    @Param('approvalId') approvalId: string,
    @Body() dto: RejectOverrideDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.userId;
    return await this.overrideApprovalService.reject(approvalId, userId, dto.reason);
  }

  @Get('override-approvals/pending')
  @ApiOperation({ summary: 'Get pending approvals for current user' })
  @ApiResponse({ status: 200, description: 'Pending approvals retrieved' })
  async getPendingApprovals(@Request() req: any) {
    const userId = req.user?.id || req.userId;
    return await this.overrideApprovalService.getPendingApprovalsForUser(userId);
  }

  @Get('override-approvals/decision/:overrideDecisionId')
  @ApiOperation({ summary: 'Get approval for override decision' })
  @ApiParam({ name: 'overrideDecisionId', description: 'Override decision ID' })
  @ApiResponse({ status: 200, description: 'Approval retrieved' })
  async getApprovalByDecision(@Param('overrideDecisionId') overrideDecisionId: string) {
    return await this.overrideApprovalService.getApprovalByDecisionId(overrideDecisionId);
  }

  // Audit Trail Endpoints

  @Get('override-audits/decision/:overrideDecisionId')
  @ApiOperation({ summary: 'Get audit record for override decision' })
  @ApiParam({ name: 'overrideDecisionId', description: 'Override decision ID' })
  @ApiResponse({ status: 200, description: 'Audit record retrieved' })
  async getAuditRecord(@Param('overrideDecisionId') overrideDecisionId: string) {
    return await this.overrideAuditService.getAuditRecord(overrideDecisionId);
  }

  @Get('override-audits/application/:applicationId')
  @ApiOperation({ summary: 'Get audit records for application' })
  @ApiParam({ name: 'applicationId', description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Audit records retrieved' })
  async getAuditRecordsForApplication(@Param('applicationId') applicationId: string) {
    return await this.overrideAuditService.getAuditRecordsForApplication(applicationId);
  }

  @Post('override-audits/batch-update')
  @ApiOperation({ summary: 'Batch update override audit outcomes' })
  @ApiResponse({ status: 200, description: 'Audit outcomes updated' })
  async batchUpdateAuditOutcomes() {
    const updated = await this.overrideAuditService.batchUpdateOutcomes();
    return { updated, message: `Updated ${updated} audit records` };
  }

  // Performance Report Endpoints

  @Post('override-performance/quarterly-report')
  @ApiOperation({ summary: 'Generate quarterly override performance report' })
  @ApiResponse({ status: 200, description: 'Report generated' })
  async generateQuarterlyReport(
    @Body() dto: { companyId: string; periodStart: string; periodEnd: string },
    @Request() req: any,
  ) {
    const generatedBy = req.user?.id || req.userId;
    return await this.overridePerformanceService.generateQuarterlyReport(
      dto.companyId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
      generatedBy,
    );
  }

  @Get('override-performance/reports')
  @ApiOperation({ summary: 'Get override performance reports' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'reportPeriod', required: false, enum: ['QUARTERLY', 'ANNUAL', 'MONTHLY'] })
  @ApiResponse({ status: 200, description: 'Reports retrieved' })
  async getPerformanceReports(
    @Query('companyId') companyId: string,
    @Query('reportPeriod') reportPeriod?: string,
  ) {
    return await this.overridePerformanceService.getReports(companyId, reportPeriod as any);
  }

  @Get('override-performance/reports/:reportId')
  @ApiOperation({ summary: 'Get override performance report by ID' })
  @ApiParam({ name: 'reportId', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report retrieved' })
  async getPerformanceReport(@Param('reportId') reportId: string) {
    return await this.overridePerformanceService.getReport(reportId);
  }

  // UC-009: Fraud Detection Alert
  @Post('applications/:applicationId/fraud-detection')
  @ApiOperation({ summary: 'Detect fraud patterns (UC-009)' })
  @ApiResponse({ status: 201, description: 'Fraud detection performed' })
  async detectFraud(@Param('applicationId') applicationId: string) {
    return await this.fraudDetectionService.detectFraud(applicationId);
  }

  @Put('fraud-alerts/:alertId/assign')
  @ApiOperation({ summary: 'Assign fraud alert to analyst' })
  @ApiResponse({ status: 200, description: 'Alert assigned' })
  async assignAlert(@Param('alertId') alertId: string, @Body() body: { assignedTo: string }) {
    return await this.fraudDetectionService.assignAlert(alertId, body.assignedTo);
  }

  @Put('fraud-alerts/:alertId')
  @ApiOperation({ summary: 'Update fraud alert investigation' })
  @ApiResponse({ status: 200, description: 'Alert updated' })
  async updateInvestigation(@Param('alertId') alertId: string, @Body() updateDto: UpdateFraudAlertDto) {
    return await this.fraudDetectionService.updateInvestigation(alertId, updateDto);
  }

  @Put('fraud-alerts/:alertId/resolve')
  @ApiOperation({ summary: 'Resolve fraud alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  async resolveAlert(
    @Param('alertId') alertId: string,
    @Body() body: { resolution: string; isFalsePositive?: boolean; reportedToLawEnforcement?: boolean },
  ) {
    return await this.fraudDetectionService.resolveAlert(
      alertId,
      body.resolution,
      body.isFalsePositive,
      body.reportedToLawEnforcement,
    );
  }

  @Get('fraud-alerts/:alertId')
  @ApiOperation({ summary: 'Get fraud alert' })
  @ApiResponse({ status: 200, description: 'Alert retrieved' })
  async getAlert(@Param('alertId') alertId: string) {
    return await this.fraudDetectionService.getAlert(alertId);
  }

  @Get('applications/:applicationId/fraud-alerts')
  @ApiOperation({ summary: 'Get fraud alerts for application' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved' })
  async getAlertsForApplication(@Param('applicationId') applicationId: string) {
    return await this.fraudDetectionService.getAlertsForApplication(applicationId);
  }

  @Get('fraud-alerts/pending')
  @ApiOperation({ summary: 'Get all pending fraud alerts' })
  @ApiResponse({ status: 200, description: 'Pending alerts retrieved' })
  async getPendingAlerts() {
    return await this.fraudDetectionService.getPendingAlerts();
  }

  // Advanced Fraud Detection Endpoints
  @Post('fraud-detection/calculate-score')
  @ApiOperation({ summary: 'Calculate real-time fraud score with ML and behavioral analysis' })
  @ApiResponse({ status: 201, description: 'Fraud score calculated' })
  async calculateFraudScore(@Body() dto: CalculateFraudScoreDto) {
    return await this.advancedFraudDetectionService.calculateFraudScore(dto);
  }

  @Post('fraud-cases')
  @ApiOperation({ summary: 'Create or update fraud case' })
  @ApiResponse({ status: 201, description: 'Fraud case created/updated' })
  async createFraudCase(@Body() dto: CreateFraudCaseDto) {
    return await this.advancedFraudDetectionService.createOrUpdateCase(
      dto.alertId,
      dto.caseType,
      dto.description,
    );
  }

  @Get('fraud-detection/analytics')
  @ApiOperation({ summary: 'Get fraud detection analytics' })
  @ApiResponse({ status: 200, description: 'Fraud analytics retrieved' })
  async getFraudAnalytics(@Query() filters: FraudAnalyticsFiltersDto) {
    const fromDate = filters.fromDate ? new Date(filters.fromDate) : undefined;
    const toDate = filters.toDate ? new Date(filters.toDate) : undefined;
    return await this.advancedFraudDetectionService.getFraudAnalytics({
      fromDate,
      toDate,
      companyId: filters.companyId,
    });
  }

  // UC-010: Adverse Action Notice
  @Post('applications/:applicationId/adverse-action-notice')
  @ApiOperation({ summary: 'Generate adverse action notice (UC-010)' })
  @ApiResponse({ status: 201, description: 'Notice generated' })
  async generateNotice(
    @Param('applicationId') applicationId: string,
    @Body() createDto?: CreateAdverseActionNoticeDto,
  ) {
    return await this.adverseActionService.generateAdverseActionNotice(applicationId, createDto);
  }

  @Post('adverse-action-notices/:noticeId/send')
  @ApiOperation({ summary: 'Send adverse action notice to applicant' })
  @ApiResponse({ status: 200, description: 'Notice sent' })
  async sendNotice(
    @Param('noticeId') noticeId: string,
    @Body() body: { deliveryMethod?: 'Email' | 'Mail' | 'Portal' },
  ) {
    return await this.adverseActionService.sendNotice(noticeId, body.deliveryMethod || 'Email');
  }

  @Post('adverse-action-notices/:noticeId/compliance')
  @ApiOperation({ summary: 'Log compliance for adverse action notice' })
  @ApiResponse({ status: 200, description: 'Compliance logged' })
  async logCompliance(@Param('noticeId') noticeId: string) {
    return await this.adverseActionService.logCompliance(noticeId);
  }

  @Get('adverse-action-notices/:noticeId')
  @ApiOperation({ summary: 'Get adverse action notice' })
  @ApiResponse({ status: 200, description: 'Notice retrieved' })
  async getNotice(@Param('noticeId') noticeId: string) {
    return await this.adverseActionService.getNotice(noticeId);
  }

  @Get('applications/:applicationId/adverse-action-notice')
  @ApiOperation({ summary: 'Get adverse action notice for application' })
  @ApiResponse({ status: 200, description: 'Notice retrieved' })
  async getNoticeForApplication(@Param('applicationId') applicationId: string) {
    return await this.adverseActionService.getNoticeForApplication(applicationId);
  }

  @Get('adverse-action-notices')
  @ApiOperation({ summary: 'Get all adverse action notices' })
  @ApiResponse({ status: 200, description: 'Notices retrieved' })
  async getAllNotices() {
    return await this.adverseActionService.getAllNotices();
  }

  @Put('adverse-action-notices/:noticeId')
  @ApiOperation({ summary: 'Update adverse action notice' })
  @ApiResponse({ status: 200, description: 'Notice updated' })
  async updateNotice(@Param('noticeId') noticeId: string, @Body() updateDto: UpdateAdverseActionNoticeDto) {
    return await this.adverseActionService.updateNotice(noticeId, updateDto);
  }

  // Auto-Approval for Low/Medium Risk
  @Post('auto-approval/evaluate')
  @ApiOperation({ summary: 'Evaluate application for auto-approval eligibility' })
  @ApiResponse({ status: 200, description: 'Auto-approval evaluation completed' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async evaluateAutoApproval(
    @Body() dto: AutoApprovalRequestDto,
    @Request() req: any,
  ) {
    return await this.autoApprovalService.evaluateAutoApproval(
      dto,
      req.user?.companyId || '',
    );
  }

  @Post('auto-approval/execute')
  @ApiOperation({ summary: 'Execute auto-approval (create credit decision)' })
  @ApiResponse({ status: 201, description: 'Auto-approval executed successfully' })
  @ApiResponse({ status: 400, description: 'Application not eligible for auto-approval' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async executeAutoApproval(
    @Body() dto: AutoApprovalRequestDto,
    @Request() req: any,
  ) {
    return await this.autoApprovalService.executeAutoApproval(
      dto,
      req.user?.companyId || '',
      req.user?.id,
    );
  }
}

