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
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { LoanRepaymentService } from './loan-repayment.service';
import { RepaymentIntegrationService } from './services/repayment-integration.service';
import { CreateLoanRepaymentDto } from './dto/create-loan-repayment.dto';
import { UpdateLoanRepaymentDto } from './dto/update-loan-repayment.dto';
import { BulkRepaymentDto } from './dto/bulk-repayment.dto';
import { QueryLoanRepaymentsDto, PaginatedLoanRepaymentsResponse } from './dto/query-loan-repayments.dto';
import { CompanyGuard } from '../../common/guards/company.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('loan-repayments')
@ApiBearerAuth('JWT-auth')
@Controller('loan-repayments')
@UseGuards(JwtAuthGuard, CompanyGuard) // JWT auth first, then multi-tenancy
export class LoanRepaymentController {
  constructor(
    private readonly loanRepaymentService: LoanRepaymentService,
    private readonly repaymentIntegrationService: RepaymentIntegrationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan repayment', description: 'Records a loan repayment and automatically allocates amounts to principal, interest, and penalty' })
  @ApiBody({ type: CreateLoanRepaymentDto })
  @ApiResponse({ status: 201, description: 'Repayment recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  create(@Body() createLoanRepaymentDto: CreateLoanRepaymentDto, @Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanRepaymentService.create(createLoanRepaymentDto, companyId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all loan repayments',
    description: 'Retrieves a paginated and filtered list of loan repayments for the authenticated user\'s company. Supports filtering by loan, repayment type, date range, amount, and search. Also supports pagination and sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of repayments retrieved successfully',
    type: PaginatedLoanRepaymentsResponse,
  })
  findAll(@Query() query: QueryLoanRepaymentsDto, @Request() req: any) {
    const companyId = req?.user?.companyId || req?.companyId;
    return this.loanRepaymentService.findAll(companyId, {
      loanId: query.loanId,
      repaymentType: query.repaymentType,
      fromDate: query.fromDate,
      toDate: query.toDate,
      minAmount: query.minAmount,
      maxAmount: query.maxAmount,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get repayment by ID', description: 'Retrieves a specific repayment by its unique identifier' })
  @ApiParam({ name: 'id', description: 'Repayment UUID', type: String })
  @ApiResponse({ status: 200, description: 'Repayment found' })
  @ApiResponse({ status: 404, description: 'Repayment not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanRepaymentService.findOne(id, companyId);
  }

  @Get('loan/:loanId')
  @ApiOperation({ summary: 'Get repayments by loan ID', description: 'Retrieves all repayments for a specific loan' })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Repayments found' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  findByLoanId(@Param('loanId') loanId: string, @Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanRepaymentService.findByLoanId(loanId, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update repayment', description: 'Updates an existing repayment record' })
  @ApiParam({ name: 'id', description: 'Repayment UUID', type: String })
  @ApiBody({ type: UpdateLoanRepaymentDto })
  @ApiResponse({ status: 200, description: 'Repayment updated successfully' })
  @ApiResponse({ status: 404, description: 'Repayment not found' })
  update(@Param('id') id: string, @Body() updateLoanRepaymentDto: UpdateLoanRepaymentDto, @Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanRepaymentService.update(id, updateLoanRepaymentDto, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete repayment', description: 'Permanently deletes a repayment record' })
  @ApiParam({ name: 'id', description: 'Repayment UUID', type: String })
  @ApiResponse({ status: 204, description: 'Repayment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Repayment not found' })
  remove(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanRepaymentService.remove(id, companyId);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process bulk repayments',
    description: 'Processes multiple loan repayments in a single operation. Returns success/failure for each repayment.',
  })
  @ApiBody({ type: BulkRepaymentDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk repayment processed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', example: 5 },
        failed: { type: 'number', example: 1 },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loanId: { type: 'string' },
              success: { type: 'boolean' },
              repaymentId: { type: 'string', nullable: true },
              error: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or loans do not exist' })
  async processBulkRepayment(@Body() bulkDto: BulkRepaymentDto, @Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return this.loanRepaymentService.processBulkRepayment(bulkDto, companyId);
  }

  // Integration Service Endpoints

  @Post(':id/send-receipt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send payment receipt via email',
    description: 'Sends payment receipt email with PDF attachment to the customer',
  })
  @ApiParam({ name: 'id', description: 'Repayment UUID', type: String })
  @ApiResponse({ status: 200, description: 'Receipt sent successfully' })
  async sendReceipt(@Param('id') id: string) {
    await this.repaymentIntegrationService.sendPaymentReceipt(id);
    return { success: true, message: 'Payment receipt sent successfully' };
  }

  @Get('loan/:loanId/export-history')
  @ApiOperation({
    summary: 'Export repayment history to Excel',
    description: 'Exports all repayment history for a loan to Excel format',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'History exported successfully' })
  async exportHistory(@Param('loanId') loanId: string) {
    const excelBuffer = await this.repaymentIntegrationService.exportRepaymentHistory(loanId);
    return {
      success: true,
      excel: excelBuffer.toString('base64'),
      filename: `repayment-history-${loanId}.xlsx`,
    };
  }

  @Get('loan/:loanId/payment-qr')
  @ApiOperation({
    summary: 'Generate payment QR code',
    description: 'Generates a QR code for making payments on a loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiQuery({ name: 'amount', required: false, type: Number, description: 'Payment amount' })
  @ApiResponse({ status: 200, description: 'QR code generated successfully' })
  async getPaymentQR(@Param('loanId') loanId: string, @Query('amount') amount?: number) {
    const paymentAmount = amount || 0;
    const qrCode = await this.repaymentIntegrationService.generatePaymentQRCode(loanId, paymentAmount);
    return {
      success: true,
      qrCode,
    };
  }
}

