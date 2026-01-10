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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoanService } from './loan.service';
import { LoanWriteOffService } from '../loan-write-off/loan-write-off.service';
import { LoanRefundService } from '../loan-refund/loan-refund.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { RequestLoanClosureDto } from './dto/request-loan-closure.dto';
import { TransferLoanDto } from './dto/transfer-loan.dto';
import { CompanyGuard } from '../../common/guards/company.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('loans')
@ApiBearerAuth('JWT-auth')
@Controller('loans')
@UseGuards(JwtAuthGuard, CompanyGuard) // JWT auth first, then multi-tenancy
export class LoanController {
  constructor(
    private readonly loanService: LoanService,
    private readonly loanWriteOffService: LoanWriteOffService,
    private readonly loanRefundService: LoanRefundService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan', description: 'Creates a new loan application with the provided details' })
  @ApiBody({ type: CreateLoanDto })
  @ApiResponse({ status: 201, description: 'Loan created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Loan number already exists' })
  create(@Body() createLoanDto: CreateLoanDto, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.create(createLoanDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all loans', description: 'Retrieves a list of all loans for the authenticated user\'s company' })
  @ApiResponse({ status: 200, description: 'List of loans retrieved successfully' })
  findAll(@Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get loan by ID', description: 'Retrieves a specific loan by its unique identifier' })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Loan found' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.findOne(id, companyId);
  }

  @Get('number/:loanNumber')
  @ApiOperation({ summary: 'Get loan by loan number', description: 'Retrieves a loan by its unique loan number' })
  @ApiParam({ name: 'loanNumber', description: 'Unique loan number', type: String })
  @ApiResponse({ status: 200, description: 'Loan found' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  findByLoanNumber(@Param('loanNumber') loanNumber: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.findByLoanNumber(loanNumber, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update loan', description: 'Updates an existing loan with new information' })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiBody({ type: UpdateLoanDto })
  @ApiResponse({ status: 200, description: 'Loan updated successfully' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  update(@Param('id') id: string, @Body() updateLoanDto: UpdateLoanDto, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.update(id, updateLoanDto, companyId);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Submit loan for approval',
    description: 'Submits a draft loan for approval workflow. Uses workflow if enabled.',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
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
  @ApiResponse({ status: 200, description: 'Loan submitted successfully' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 400, description: 'Loan cannot be submitted in current status' })
  submit(
    @Param('id') id: string,
    @Request() req,
    @Body()
    body?: {
      userId?: string;
      userRoles?: string[];
      comments?: string;
    },
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.submit(id, companyId, body?.userId, body?.userRoles, body?.comments);
  }

  @Post(':id/workflow-action')
  @ApiOperation({
    summary: 'Perform workflow action',
    description: 'Performs a workflow action on the loan (e.g., Approve, Reject)',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', example: 'Approve', description: 'Action to perform' },
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
    @Request() req,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.performWorkflowAction(
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
    description: 'Gets available workflow actions for the loan in its current state',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Available actions retrieved successfully' })
  async getAvailableActions(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.getAvailableActions(id, companyId);
  }

  @Get(':id/workflow-history')
  @ApiOperation({
    summary: 'Get workflow history',
    description: 'Retrieves the workflow action history for the loan',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Workflow history retrieved successfully' })
  async getWorkflowHistory(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.getWorkflowHistory(id, companyId);
  }

  @Post(':id/trigger-fldg')
  @ApiOperation({
    summary: 'Trigger FLDG',
    description: 'Manually triggers FLDG (First Loss Default Guarantee) for a loan',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'FLDG triggered successfully' })
  @ApiResponse({ status: 400, description: 'FLDG cannot be triggered' })
  async triggerFldg(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.triggerFldg(id, companyId);
  }

  @Post(':id/check-fldg')
  @ApiOperation({
    summary: 'Check FLDG trigger condition',
    description: 'Checks if FLDG should be triggered based on DPD and partner configuration',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'FLDG check completed' })
  async checkFldg(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.checkFldg(id, companyId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel loan', description: 'Cancels a loan application' })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Loan cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 400, description: 'Loan cannot be cancelled in current status' })
  cancel(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.cancel(id, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete loan', description: 'Permanently deletes a loan (only if in draft status)' })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 204, description: 'Loan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 400, description: 'Loan cannot be deleted in current status' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.remove(id, companyId);
  }

  @Post(':id/request-closure')
  @ApiOperation({ summary: 'Request loan closure', description: 'Requests closure of a loan. If autoClose is true and all amounts are paid, closes immediately.' })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiBody({ type: RequestLoanClosureDto })
  @ApiResponse({ status: 200, description: 'Loan closure requested or closed successfully' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 400, description: 'Loan cannot be closed in current status or has outstanding amounts' })
  requestClosure(
    @Param('id') id: string,
    @Body() dto: RequestLoanClosureDto,
    @Request() req,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.requestLoanClosure(
      id,
      companyId,
      dto.postingDate ? new Date(dto.postingDate) : undefined,
      dto.autoClose || false,
    );
  }

  @Post(':id/close-unsecured')
  @ApiOperation({ summary: 'Close unsecured term loan', description: 'Closes an unsecured term loan immediately if all amounts are paid' })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Loan closed successfully' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 400, description: 'Loan is secured or not a term loan, or has outstanding amounts' })
  closeUnsecured(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.closeUnsecuredTermLoan(id, companyId);
  }

  @Post(':id/generate-schedule')
  @ApiOperation({ summary: 'Generate repayment schedule', description: 'Generates repayment schedule for a term loan based on EMI calculation' })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 201, description: 'Repayment schedule generated successfully' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 400, description: 'Loan cannot have schedule generated or schedule already exists' })
  generateSchedule(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.generateRepaymentSchedule(id, companyId);
  }

  @Post('update-dpd')
  @ApiOperation({
    summary: 'Update days past due',
    description:
      'Updates days past due and NPA classification for loans. Automatically marks loans as NPA if DPD exceeds threshold.',
  })
  @ApiResponse({
    status: 200,
    description: 'Days past due updated successfully',
  })
  updateDaysPastDue(@Body() body: { loanId?: string; postingDate?: string }, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.updateDaysPastDue(
      companyId,
      body.loanId,
      body.postingDate ? new Date(body.postingDate) : undefined,
    );
  }

  @Post(':id/mark-npa')
  @ApiOperation({
    summary: 'Manually mark loan as NPA',
    description:
      'Manually marks a loan as NPA. This will also mark all other loans for the same customer as NPA.',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        postingDate: {
          type: 'string',
          format: 'date',
          description: 'Posting date (optional, defaults to today)',
        },
        manualNpa: {
          type: 'boolean',
          description: 'Is manual NPA marking (default: true)',
          default: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Loan marked as NPA successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Loan cannot be marked as NPA in current status',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  markAsNpa(
    @Param('id') id: string,
    @Body()
    body: {
      postingDate?: string;
      manualNpa?: boolean;
    },
    @Request() req,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.markAsNpa(
      id,
      companyId,
      body.postingDate ? new Date(body.postingDate) : undefined,
      body.manualNpa ?? true,
    );
  }

  @Post(':id/unmark-npa')
  @ApiOperation({
    summary: 'Unmark loan as NPA',
    description:
      'Unmarks a loan as NPA. Can only be done if watch period has ended and DPD is 0.',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        postingDate: {
          type: 'string',
          format: 'date',
          description: 'Posting date (optional, defaults to today)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Loan unmarked as NPA successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Loan cannot be unmarked (watch period not ended or DPD > 0)',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  unmarkAsNpa(
    @Param('id') id: string,
    @Body()
    body: {
      postingDate?: string;
    },
    @Request() req,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.unmarkAsNpa(
      id,
      companyId,
      body.postingDate ? new Date(body.postingDate) : undefined,
    );
  }

  @Post(':id/make-write-off')
  @ApiOperation({
    summary: 'Make loan write-off',
    description:
      'Creates a write-off entry for a loan. Matches Frappe API signature. Write-off amount is auto-calculated if not provided.',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyId: { type: 'string', description: 'Company UUID (optional)' },
        postingDate: {
          type: 'string',
          format: 'date',
          description: 'Posting date (optional, defaults to today)',
        },
        amount: {
          type: 'number',
          description: 'Write-off amount (optional, auto-calculated from pending principal)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Write-off created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid write-off amount or loan status',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  makeLoanWriteOff(
    @Param('id') id: string,
    @Body()
    body: {
      companyId?: string;
      postingDate?: string;
      amount?: number;
    },
  ) {
    return this.loanWriteOffService.makeLoanWriteOff(
      id,
      body.companyId,
      body.postingDate ? new Date(body.postingDate) : undefined,
      body.amount,
    );
  }

  @Post(':id/make-refund-jv')
  @ApiOperation({
    summary: 'Make refund journal entry',
    description:
      'Creates a refund entry for a loan. Matches Frappe API signature. Refund amount is auto-calculated from excess amount if not provided.',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Refund amount (optional, auto-calculated from excess amount)',
        },
        referenceNumber: {
          type: 'string',
          description: 'Reference number (optional)',
        },
        referenceDate: {
          type: 'string',
          format: 'date',
          description: 'Reference date (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Refund created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'No excess amount pending for refund',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  makeRefundJv(
    @Param('id') id: string,
    @Body()
    body: {
      amount?: number;
      referenceNumber?: string;
      referenceDate?: string;
    },
  ) {
    return this.loanRefundService.makeRefundJv(
      id,
      body.amount,
      body.referenceNumber,
      body.referenceDate ? new Date(body.referenceDate) : undefined,
    );
  }

  @Get(':id/available-limit')
  @ApiOperation({
    summary: 'Get available limit for Line of Credit',
    description: 'Retrieves limit details (maximum, utilized, available) for a Line of Credit loan',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Limit details retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Loan is not a Line of Credit',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  getAvailableLimit(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.getAvailableLimit(id, companyId);
  }

  @Post(':id/update-maximum-limit')
  @ApiOperation({
    summary: 'Update maximum limit for Line of Credit',
    description: 'Updates the maximum limit amount for a Line of Credit loan',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        maximumLimit: {
          type: 'number',
          description: 'New maximum limit amount',
        },
      },
      required: ['maximumLimit'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Maximum limit updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid limit amount or loan is not a Line of Credit',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  updateMaximumLimit(
    @Param('id') id: string,
    @Body() body: { maximumLimit: number },
    @Request() req,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.updateMaximumLimitAmount(id, companyId, body.maximumLimit);
  }

  @Post(':id/update-available-limit')
  @ApiOperation({
    summary: 'Recalculate available limit for Line of Credit',
    description: 'Recalculates and updates the available limit based on current disbursements',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Available limit updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Loan is not a Line of Credit or maximum limit not set',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  updateAvailableLimit(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.updateAvailableLimitAmount(id, companyId);
  }

  @Post(':id/transfer')
  @ApiOperation({
    summary: 'Transfer loan to new customer',
    description: 'Transfers a loan from one customer/applicant to another. Validates loan status and creates transfer record.',
  })
  @ApiParam({ name: 'id', description: 'Loan UUID', type: String })
  @ApiBody({ type: require('./dto/transfer-loan.dto').TransferLoanDto })
  @ApiResponse({
    status: 200,
    description: 'Loan transferred successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Loan cannot be transferred in current status or invalid transfer',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  transferLoan(
    @Param('id') id: string,
    @Body() dto: TransferLoanDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanService.transferLoan(
      id,
      companyId,
      dto.newApplicantType,
      dto.newApplicantId,
      dto.transferDate ? new Date(dto.transferDate) : undefined,
      dto.referenceNumber,
      dto.remarks,
    );
  }
}

