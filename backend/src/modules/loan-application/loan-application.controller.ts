import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { LoanApplicationService } from './loan-application.service';
import { LoanApplicationSeedService } from './loan-application-seed.service';
import { ApplicationRecoveryService } from './application-recovery.service';
import { LoanApplicationIntegrationService } from './services/loan-application-integration.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { UpdateLoanApplicationDto } from './dto/update-loan-application.dto';
import { QueryLoanApplicationsDto, PaginatedLoanApplicationsResponse } from './dto/query-loan-applications.dto';
import { CompanyGuard } from '../../common/guards/company.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('loan-applications')
@ApiBearerAuth('JWT-auth')
@Controller('loan-applications')
@UseGuards(JwtAuthGuard, CompanyGuard) // JWT auth first, then multi-tenancy
export class LoanApplicationController {
  constructor(
    private readonly loanApplicationService: LoanApplicationService,
    private readonly loanApplicationSeedService: LoanApplicationSeedService,
    private readonly applicationRecoveryService: ApplicationRecoveryService,
    private readonly integrationService: LoanApplicationIntegrationService,
  ) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan application', description: 'Creates a new loan application for review and approval. Public endpoint - no authentication required.' })
  @ApiBody({ type: CreateLoanApplicationDto })
  @ApiResponse({ status: 201, description: 'Loan application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createDto: CreateLoanApplicationDto, @Request() req) {
    // For public submissions, companyId must be provided in the request body
    const companyId = req.user?.companyId || req.companyId || createDto.companyId;
    return this.loanApplicationService.create(createDto, companyId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all loan applications',
    description: 'Retrieves a paginated and filtered list of loan applications for the authenticated user\'s company. Supports filtering by status, date range, amount, applicant, and loan product. Also supports pagination and sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of applications retrieved successfully',
    type: PaginatedLoanApplicationsResponse,
  })
  findAll(@Query() query: QueryLoanApplicationsDto, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanApplicationService.findAll(companyId, {
      status: query.status,
      applicantType: query.applicantType,
      applicantId: query.applicantId,
      loanProductId: query.loanProductId,
      minAmount: query.minAmount,
      maxAmount: query.maxAmount,
      fromDate: query.fromDate,
      toDate: query.toDate,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: query.page,
      limit: query.limit,
    });
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed loan applications and related data',
    description: 'Creates sample loan applications, loans, disbursements, and repayments for development/testing',
  })
  @ApiResponse({ status: 201, description: 'Seed data created successfully' })
  @ApiResponse({ status: 400, description: 'Seed data already exists or error occurred' })
  async seed() {
    await this.loanApplicationSeedService.seedLoanApplications();
    return {
      message: 'Loan applications and related data seeded successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get loan application by ID', description: 'Retrieves a specific loan application by its unique identifier' })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'Application found' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanApplicationService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update loan application', description: 'Updates an existing loan application' })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiBody({ type: UpdateLoanApplicationDto })
  @ApiResponse({ status: 200, description: 'Application updated successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 400, description: 'Application cannot be updated in current status' })
  update(@Param('id') id: string, @Body() updateDto: UpdateLoanApplicationDto, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanApplicationService.update(id, updateDto, companyId);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Submit loan application for review',
    description: 'Submits a loan application and optionally triggers credit scoring if data is provided.',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'Application submitted successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 400, description: 'Application cannot be submitted in current status' })
  async submit(
    @Param('id') id: string,
    @Body() body: { scoringData?: any },
    @Request() req,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanApplicationService.submit(id, companyId, body.scoringData);
  }

  @Post(':id/calculate-credit-score')
  @ApiOperation({
    summary: 'Calculate weighted credit score',
    description: 'Calculates weighted credit score for a loan application using multi-source data.',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'Credit score calculated successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async calculateCreditScore(
    @Param('id') id: string,
    @Body() body: { scoringData?: any },
    @Request() req,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanApplicationService.calculateCreditScore(id, companyId, body.scoringData);
  }

  @Post(':id/approve')
  @ApiOperation({
    summary: 'Approve loan application',
    description: 'Approves a loan application. Uses workflow if enabled, otherwise direct approval.',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID performing the action' },
        userRoles: {
          type: 'array',
          items: { type: 'string' },
          description: 'User roles (for workflow validation)',
        },
        comments: { type: 'string', description: 'Optional comments' },
      },
    },
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Application approved successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 400, description: 'Application cannot be approved in current status' })
  approve(
    @Param('id') id: string,
    @Body()
    body?: {
      userId?: string;
      userRoles?: string[];
      comments?: string;
    },
    @Request() req?: any,
  ) {
    const companyId = req?.user?.companyId || req?.companyId;
    return this.loanApplicationService.approve(
      id,
      companyId,
      body?.userId,
      body?.userRoles,
      body?.comments,
    );
  }

  @Post(':id/reject')
  @ApiOperation({
    summary: 'Reject loan application',
    description: 'Rejects a loan application. Uses workflow if enabled, otherwise direct rejection.',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID performing the action' },
        userRoles: {
          type: 'array',
          items: { type: 'string' },
          description: 'User roles (for workflow validation)',
        },
        comments: { type: 'string', description: 'Optional comments' },
      },
    },
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Application rejected successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  reject(
    @Param('id') id: string,
    @Body()
    body?: {
      userId?: string;
      userRoles?: string[];
      comments?: string;
    },
    @Request() req?: any,
  ) {
    const companyId = req?.user?.companyId || req?.companyId;
    return this.loanApplicationService.reject(
      id,
      companyId,
      body?.userId,
      body?.userRoles,
      body?.comments,
    );
  }

  @Post(':id/workflow-action')
  @ApiOperation({
    summary: 'Perform workflow action',
    description: 'Performs a workflow action on the application (e.g., Initiate, Review, Complete KYC)',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', example: 'Initiate', description: 'Action to perform' },
        userId: { type: 'string', description: 'User ID performing the action' },
        userRoles: {
          type: 'array',
          items: { type: 'string' },
          description: 'User roles',
        },
        comments: { type: 'string', description: 'Optional comments' },
      },
      required: ['action', 'userId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Workflow action performed successfully' })
  @ApiResponse({ status: 400, description: 'Action not available or invalid' })
  async performWorkflowAction(
    @Param('id') id: string,
    @Body()
    body: {
      action: string;
      userId: string;
      userRoles?: string[];
      comments?: string;
    },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanApplicationService.performWorkflowAction(
      id,
      companyId,
      body.action,
      body.userId,
      body.userRoles,
      body.comments,
    );
  }

  @Get(':id/available-actions')
  @ApiOperation({
    summary: 'Get available workflow actions',
    description: 'Gets available workflow actions for the application in its current state',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'Available actions retrieved successfully' })
  async getAvailableActions(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanApplicationService.getAvailableActions(id, companyId);
  }

  @Get(':id/workflow-history')
  @ApiOperation({
    summary: 'Get workflow history',
    description: 'Retrieves the workflow action history for the application',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'Workflow history retrieved successfully' })
  async getWorkflowHistory(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanApplicationService.getWorkflowHistory(id, companyId);
  }

  @Get('abandoned/list')
  @ApiOperation({
    summary: 'Get abandoned applications',
    description: 'Retrieves list of abandoned (draft) applications older than 24 hours',
  })
  @ApiResponse({ status: 200, description: 'Abandoned applications retrieved successfully' })
  async getAbandonedApplications() {
    const abandoned = await this.applicationRecoveryService.findAbandonedApplications();
    return {
      count: abandoned.length,
      applications: abandoned.map((app) => ({
        id: app.id,
        applicationNumber: app.applicationNumber,
        createdAt: app.createdAt,
        daysSinceCreated: this.applicationRecoveryService.calculateDaysSinceCreated(app),
        priority: this.applicationRecoveryService.getRecoveryPriority(app),
      })),
    };
  }

  @Get(':id/is-abandoned')
  @ApiOperation({
    summary: 'Check if application is abandoned',
    description: 'Checks if an application is considered abandoned (draft, >24 hours old)',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'Abandoned status retrieved successfully' })
  async checkIfAbandoned(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    const isAbandoned = await this.applicationRecoveryService.isAbandoned(id);
    const application = await this.loanApplicationService.findOne(id, companyId);
    
    if (!application) {
      return { isAbandoned: false, error: 'Application not found' };
    }

    return {
      isAbandoned,
      daysSinceCreated: this.applicationRecoveryService.calculateDaysSinceCreated(application),
      priority: isAbandoned ? this.applicationRecoveryService.getRecoveryPriority(application) : null,
    };
  }

  @Post(':id/recover')
  @ApiOperation({
    summary: 'Mark application as recovered',
    description: 'Marks an abandoned application as recovered when user returns to complete it',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'Application marked as recovered' })
  async recoverApplication(@Param('id') id: string) {
    await this.applicationRecoveryService.markAsRecovered(id);
    return { success: true, message: 'Application marked as recovered' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete loan application', description: 'Permanently deletes a loan application' })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 204, description: 'Application deleted successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  remove(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanApplicationService.remove(id, companyId);
  }

  // Integration Service Endpoints

  @Post(':id/send-confirmation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send application confirmation email',
    description: 'Sends confirmation email with QR code to applicant',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'Confirmation email sent successfully' })
  async sendConfirmation(@Param('id') id: string) {
    await this.integrationService.sendApplicationConfirmation(id);
    return { success: true, message: 'Confirmation email sent successfully' };
  }

  @Post(':id/documents')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload document to application',
    description: 'Uploads a supporting document to the loan application',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'Document uploaded successfully' })
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return await this.integrationService.attachDocumentToApplication(id, file);
  }

  @Post(':id/send-pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate and email application PDF',
    description: 'Generates PDF from application and emails it to applicant',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'PDF generated and sent successfully' })
  async sendPDF(@Param('id') id: string) {
    await this.integrationService.generateAndEmailApplicationPDF(id);
    return { success: true, message: 'PDF generated and sent successfully' };
  }

  @Post(':id/status-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send status update email',
    description: 'Sends email notification when application status changes',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'Status update email sent successfully' })
  async sendStatusUpdate(
    @Param('id') id: string,
    @Body() body: { newStatus: string },
  ) {
    await this.integrationService.sendStatusUpdateEmail(id, body.newStatus);
    return { success: true, message: 'Status update email sent successfully' };
  }

  @Get(':id/summary')
  @ApiOperation({
    summary: 'Generate application summary',
    description: 'Generates PDF summary and QR code for application',
  })
  @ApiParam({ name: 'id', description: 'Application UUID', type: String })
  @ApiResponse({ status: 200, description: 'Summary generated successfully' })
  async getSummary(@Param('id') id: string) {
    const summary = await this.integrationService.generateApplicationSummary(id);
    return {
      success: true,
      pdf: summary.pdf.toString('base64'),
      qrCode: summary.qrCode,
    };
  }
}

