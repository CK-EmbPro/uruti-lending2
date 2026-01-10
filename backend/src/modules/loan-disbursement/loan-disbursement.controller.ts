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
import { LoanDisbursementService } from './loan-disbursement.service';
import { DisbursementIntegrationService } from './services/disbursement-integration.service';
import { CreateLoanDisbursementDto } from './dto/create-loan-disbursement.dto';
import { UpdateLoanDisbursementDto } from './dto/update-loan-disbursement.dto';

@ApiTags('loan-disbursements')
@ApiBearerAuth('JWT-auth')
@Controller('loan-disbursements')
export class LoanDisbursementController {
  constructor(
    private readonly loanDisbursementService: LoanDisbursementService,
    private readonly disbursementIntegrationService: DisbursementIntegrationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan disbursement', description: 'Records a loan disbursement transaction' })
  @ApiBody({ type: CreateLoanDisbursementDto })
  @ApiResponse({ status: 201, description: 'Disbursement recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or disbursement exceeds loan amount' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  create(@Body() createLoanDisbursementDto: CreateLoanDisbursementDto) {
    return this.loanDisbursementService.create(createLoanDisbursementDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all loan disbursements', description: 'Retrieves a list of all loan disbursements' })
  @ApiQuery({ name: 'loanId', required: false, description: 'Filter by loan ID' })
  @ApiResponse({ status: 200, description: 'List of disbursements retrieved successfully' })
  findAll(@Query('loanId') loanId?: string) {
    return this.loanDisbursementService.findAll(loanId);
  }

  @Get('loan/:loanId')
  @ApiOperation({ summary: 'Get disbursements by loan ID', description: 'Retrieves all disbursements for a specific loan' })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Disbursements found' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  findByLoanId(@Param('loanId') loanId: string) {
    return this.loanDisbursementService.findByLoanId(loanId);
  }

  @Get('disbursal-amount/:loanId')
  @ApiOperation({
    summary: 'Get available disbursal amount',
    description: 'Calculates and returns the available disbursal amount for a loan based on security value and pending principal amount',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiQuery({
    name: 'onCurrentSecurityPrice',
    required: false,
    type: Boolean,
    description: 'Use current security price for calculation (default: false)',
  })
  @ApiResponse({
    status: 200,
    description: 'Disbursal amount calculated successfully',
    schema: {
      type: 'object',
      properties: {
        disbursalAmount: { type: 'number', example: 500000 },
        pendingPrincipalAmount: { type: 'number', example: 200000 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  getDisbursalAmount(
    @Param('loanId') loanId: string,
    @Query('onCurrentSecurityPrice') onCurrentSecurityPrice?: string,
  ) {
    const useCurrentPrice =
      onCurrentSecurityPrice === 'true' || onCurrentSecurityPrice === '1';
    return this.loanDisbursementService.getDisbursalAmount(
      loanId,
      useCurrentPrice,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get disbursement by ID', description: 'Retrieves a specific disbursement by its unique identifier' })
  @ApiParam({ name: 'id', description: 'Disbursement UUID', type: String })
  @ApiResponse({ status: 200, description: 'Disbursement found' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
  findOne(@Param('id') id: string) {
    return this.loanDisbursementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update disbursement', description: 'Updates an existing disbursement record' })
  @ApiParam({ name: 'id', description: 'Disbursement UUID', type: String })
  @ApiBody({ type: UpdateLoanDisbursementDto })
  @ApiResponse({ status: 200, description: 'Disbursement updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data, loan status prevents update, or amount exceeds loan limit' })
  @ApiResponse({ status: 404, description: 'Disbursement or loan not found' })
  update(@Param('id') id: string, @Body() updateLoanDisbursementDto: UpdateLoanDisbursementDto) {
    return this.loanDisbursementService.update(id, updateLoanDisbursementDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete disbursement', description: 'Permanently deletes a disbursement record' })
  @ApiParam({ name: 'id', description: 'Disbursement UUID', type: String })
  @ApiResponse({ status: 204, description: 'Disbursement deleted successfully' })
  @ApiResponse({ status: 400, description: 'Loan status prevents deletion (loan is DISBURSED, ACTIVE, or CLOSED)' })
  @ApiResponse({ status: 404, description: 'Disbursement or loan not found' })
  remove(@Param('id') id: string) {
    return this.loanDisbursementService.remove(id);
  }

  // Integration Service Endpoints

  @Post(':id/send-notification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send disbursement notification via email',
    description: 'Sends disbursement notification email with PDF attachment to the customer',
  })
  @ApiParam({ name: 'id', description: 'Disbursement UUID', type: String })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotification(@Param('id') id: string) {
    await this.disbursementIntegrationService.sendDisbursementNotification(id);
    return { success: true, message: 'Disbursement notification sent successfully' };
  }

  @Get('loan/:loanId/agreement-pdf')
  @ApiOperation({
    summary: 'Generate loan agreement PDF',
    description: 'Generates loan agreement PDF with QR code for tracking',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Agreement generated successfully' })
  async getAgreementPDF(@Param('loanId') loanId: string) {
    const result = await this.disbursementIntegrationService.generateLoanAgreementPDF(loanId);
    return {
      success: true,
      pdf: result.pdf.toString('base64'),
      qrCode: result.qrCode,
    };
  }
}

