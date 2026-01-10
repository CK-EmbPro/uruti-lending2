import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ComplianceService } from './services/compliance.service';
import { RegTechAutomationService } from './services/regtech-automation.service';
import { InstantKYCAMLService } from './services/instant-kyc-aml.service';
import { PerformScreeningDto, InvestigateMatchDto, FileSARDto, ResolveScreeningDto } from './dto/kyc-screening.dto';
import { InstantKYCCheckRequestDto, InstantKYCCheckResponseDto } from './dto/instant-kyc-aml.dto';
import { CreateConsentDto, WithdrawConsentDto, CreatePrivacyRequestDto, ProcessPrivacyRequestDto, CompletePrivacyRequestDto, RejectPrivacyRequestDto } from './dto/privacy-consent.dto';
import { QueryAuditLogsDto } from './dto/audit-log.dto';
import { CreateRetentionRecordDto, PlaceLegalHoldDto, ReleaseLegalHoldDto, ArchiveDocumentDto, PurgeDocumentDto } from './dto/document-retention.dto';
import {
  CreateRegulatoryChangeDto,
  RunComplianceCheckDto,
  CreateCompliancePolicyDto,
  GenerateComplianceReportDto,
  GetComplianceChecksDto,
} from './dto/regtech.dto';
import { ScreeningType, ScreeningStatus } from './entities/kyc-screening.entity';
import { ConsentType, ConsentStatus } from './entities/privacy-consent.entity';
import { RequestType, RequestStatus } from './entities/privacy-consent.entity';
import { AuditEventType, AuditEntityType } from './entities/audit-log.entity';
import { RetentionCategory, RetentionStatus } from './entities/document-retention.entity';

@ApiTags('compliance')
@ApiBearerAuth('JWT-auth')
@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly regTechService: RegTechAutomationService,
    private readonly instantKYCAMLService: InstantKYCAMLService,
  ) {}

  /**
   * UC-044: KYC/AML Screening
   */
  @Post('kyc-screening/perform')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Perform KYC/AML screening',
    description: 'Screens application against OFAC, sanctions lists, PEP databases',
  })
  @ApiResponse({
    status: 201,
    description: 'Screening performed successfully',
  })
  async performScreening(
    @Body() dto: PerformScreeningDto,
    @Request() req: any,
  ) {
    return this.complianceService.performScreening(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('kyc-screening')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get KYC screenings',
    description: 'Retrieves KYC screening records with optional filters',
  })
  async getKYCScreenings(
    @Query('applicationId') applicationId?: string,
    @Query('screeningType') screeningType?: ScreeningType,
    @Query('status') status?: ScreeningStatus,
  ) {
    return this.complianceService.getKYCScreenings({
      applicationId,
      screeningType,
      status,
    });
  }

  @Post('kyc-screening/:id/investigate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Investigate KYC match',
    description: 'Marks a screening match for investigation',
  })
  async investigateMatch(
    @Param('id') id: string,
    @Body() dto: InvestigateMatchDto,
    @Request() req: any,
  ) {
    return this.complianceService.investigateMatch(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('kyc-screening/:id/file-sar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'File Suspicious Activity Report',
    description: 'Files a SAR for a flagged screening',
  })
  async fileSAR(
    @Param('id') id: string,
    @Body() dto: FileSARDto,
    @Request() req: any,
  ) {
    return this.complianceService.fileSAR(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('kyc-screening/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve KYC screening',
    description: 'Marks a screening as resolved',
  })
  async resolveScreening(
    @Param('id') id: string,
    @Body() dto: ResolveScreeningDto,
    @Request() req: any,
  ) {
    return this.complianceService.resolveScreening(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * UC-045: Privacy Consent Management
   */
  @Post('privacy-consents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create privacy consent',
    description: 'Records privacy consent from borrower',
  })
  @ApiResponse({
    status: 201,
    description: 'Privacy consent created successfully',
  })
  async createConsent(
    @Body() dto: CreateConsentDto,
    @Request() req: any,
  ) {
    return this.complianceService.createConsent(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('privacy-consents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get privacy consents',
    description: 'Retrieves privacy consent records',
  })
  async getPrivacyConsents(
    @Query('applicationId') applicationId?: string,
    @Query('customerId') customerId?: string,
    @Query('consentType') consentType?: ConsentType,
    @Query('status') status?: ConsentStatus,
  ) {
    return this.complianceService.getPrivacyConsents({
      applicationId,
      customerId,
      consentType,
      status,
    });
  }

  @Post('privacy-consents/:id/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Withdraw privacy consent',
    description: 'Records withdrawal of privacy consent',
  })
  async withdrawConsent(
    @Param('id') id: string,
    @Body() dto: WithdrawConsentDto,
    @Request() req: any,
  ) {
    return this.complianceService.withdrawConsent(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('privacy-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create privacy request',
    description: 'Creates a GDPR/CCPA privacy request (access, deletion, etc.)',
  })
  @ApiResponse({
    status: 201,
    description: 'Privacy request created successfully',
  })
  async createPrivacyRequest(
    @Body() dto: CreatePrivacyRequestDto,
    @Request() req: any,
  ) {
    return this.complianceService.createPrivacyRequest(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('privacy-requests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get privacy requests',
    description: 'Retrieves privacy request records',
  })
  async getPrivacyRequests(
    @Query('customerId') customerId?: string,
    @Query('requestType') requestType?: RequestType,
    @Query('status') status?: RequestStatus,
  ) {
    return this.complianceService.getPrivacyRequests({
      customerId,
      requestType,
      status,
    });
  }

  @Post('privacy-requests/:id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process privacy request',
    description: 'Marks a privacy request as in progress',
  })
  async processPrivacyRequest(
    @Param('id') id: string,
    @Body() dto: ProcessPrivacyRequestDto,
    @Request() req: any,
  ) {
    return this.complianceService.processPrivacyRequest(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('privacy-requests/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete privacy request',
    description: 'Marks a privacy request as completed',
  })
  async completePrivacyRequest(
    @Param('id') id: string,
    @Body() dto: CompletePrivacyRequestDto,
    @Request() req: any,
  ) {
    return this.complianceService.completePrivacyRequest(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('privacy-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject privacy request',
    description: 'Rejects a privacy request',
  })
  async rejectPrivacyRequest(
    @Param('id') id: string,
    @Body() dto: RejectPrivacyRequestDto,
    @Request() req: any,
  ) {
    return this.complianceService.rejectPrivacyRequest(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * UC-046: Audit Trail Review
   */
  @Get('audit-logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query audit logs',
    description: 'Retrieves comprehensive audit trail with filtering',
  })
  async queryAuditLogs(@Query() dto: QueryAuditLogsDto) {
    return this.complianceService.queryAuditLogs(dto);
  }

  /**
   * UC-047: Document Retention Management
   */
  @Post('document-retention')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create retention record',
    description: 'Creates a document retention record',
  })
  @ApiResponse({
    status: 201,
    description: 'Retention record created successfully',
  })
  async createRetentionRecord(
    @Body() dto: CreateRetentionRecordDto,
    @Request() req: any,
  ) {
    return this.complianceService.createRetentionRecord(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('document-retention')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get document retentions',
    description: 'Retrieves document retention records',
  })
  async getDocumentRetentions(
    @Query('documentId') documentId?: string,
    @Query('retentionCategory') retentionCategory?: RetentionCategory,
    @Query('status') status?: RetentionStatus,
    @Query('onLegalHold') onLegalHold?: boolean,
  ) {
    return this.complianceService.getDocumentRetentions({
      documentId,
      retentionCategory,
      status,
      onLegalHold: typeof onLegalHold === 'string' ? onLegalHold === 'true' : onLegalHold === true,
    });
  }

  @Post('document-retention/:id/legal-hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Place legal hold',
    description: 'Places a legal hold on a document',
  })
  async placeLegalHold(
    @Param('id') id: string,
    @Body() dto: PlaceLegalHoldDto,
    @Request() req: any,
  ) {
    return this.complianceService.placeLegalHold(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('document-retention/:id/release-hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release legal hold',
    description: 'Releases a legal hold on a document',
  })
  async releaseLegalHold(
    @Param('id') id: string,
    @Body() dto: ReleaseLegalHoldDto,
    @Request() req: any,
  ) {
    return this.complianceService.releaseLegalHold(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('document-retention/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive document',
    description: 'Archives a document for retention',
  })
  async archiveDocument(
    @Param('id') id: string,
    @Body() dto: ArchiveDocumentDto,
    @Request() req: any,
  ) {
    return this.complianceService.archiveDocument(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('document-retention/:id/purge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Purge document',
    description: 'Purges a document after retention period expires',
  })
  async purgeDocument(
    @Param('id') id: string,
    @Body() dto: PurgeDocumentDto,
    @Request() req: any,
  ) {
    return this.complianceService.purgeDocument(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  // RegTech Automation Endpoints
  @Post('regulatory-changes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create regulatory change record' })
  @ApiResponse({ status: 201, description: 'Regulatory change created' })
  async createRegulatoryChange(@Body() dto: CreateRegulatoryChangeDto, @Request() req: any) {
    return await this.regTechService.createRegulatoryChange(dto, req.user.id);
  }

  @Post('compliance-checks/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run compliance check' })
  @ApiResponse({ status: 200, description: 'Compliance check completed' })
  async runComplianceCheck(@Body() dto: RunComplianceCheckDto, @Request() req: any) {
    return await this.regTechService.runComplianceCheck(dto, req.user.id);
  }

  @Get('compliance-checks')
  @ApiOperation({ summary: 'Get compliance checks' })
  @ApiResponse({ status: 200, description: 'Compliance checks retrieved' })
  async getComplianceChecks(@Query() filters: GetComplianceChecksDto) {
    return await this.regTechService.getComplianceChecks(filters);
  }

  @Post('policies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create compliance policy' })
  @ApiResponse({ status: 201, description: 'Compliance policy created' })
  async createCompliancePolicy(@Body() dto: CreateCompliancePolicyDto, @Request() req: any) {
    return await this.regTechService.createCompliancePolicy(dto, req.user.id);
  }

  @Post('reports/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate compliance report' })
  @ApiResponse({ status: 200, description: 'Compliance report generated' })
  async generateComplianceReport(@Body() dto: GenerateComplianceReportDto, @Request() req: any) {
    return await this.regTechService.generateComplianceReport(dto, req.user.id);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get compliance dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Compliance metrics retrieved' })
  async getComplianceMetrics() {
    return await this.regTechService.getComplianceMetrics();
  }

  /**
   * Instant KYC/AML Checks
   */
  @Post('instant-kyc-aml/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perform instant KYC/AML checks with parallel processing',
    description: `
Performs comprehensive instant KYC/AML checks with all checks running in parallel for maximum speed.

## Features:
- **National ID Verification**: Real-time verification with government database
- **Credit Bureau**: Credit history retrieved from credit bureaus
- **Sanctions Lists**: OFAC and local sanctions lists checked
- **Adverse Media**: Negative news screening performed
- **Parallel Processing**: All checks run simultaneously (not sequential)
- **Risk Scoring**: Green/Yellow/Red classification based on results
- **Auto-rejection**: Sanctions hit = immediate rejection

## Risk Levels:
- **GREEN**: Low risk (risk score < 40)
- **YELLOW**: Medium risk (risk score 40-69)
- **RED**: High risk (risk score >= 70) or sanctions match

## Auto-rejection:
Applications with sanctions list matches are automatically rejected immediately.
    `.trim(),
  })
  @ApiResponse({
    status: 200,
    description: 'Instant KYC/AML checks completed',
    type: InstantKYCCheckResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or application not found' })
  async performInstantChecks(
    @Body() dto: InstantKYCCheckRequestDto,
  ): Promise<InstantKYCCheckResponseDto> {
    return await this.instantKYCAMLService.performInstantChecks(dto);
  }
}

