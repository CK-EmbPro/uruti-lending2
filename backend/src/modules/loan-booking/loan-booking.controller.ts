import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoanBookingService } from './services/loan-booking.service';
import { RateLockService } from './services/rate-lock.service';
import { DisbursementWorkflowService } from './services/disbursement-workflow.service';
import {
  CreateLoanBookingDto,
  UpdateLoanBookingDto,
  CancelLoanBookingDto,
} from './dto/loan-booking.dto';
import { CreateLoanDocumentDto } from './dto/loan-document.dto';
import {
  CreateLoanSignatureDto,
  SignDocumentDto,
  NotarizeDocumentDto,
} from './dto/loan-signature.dto';
import {
  CreateRateLockDto,
  ExtendRateLockDto,
  ExerciseFloatDownDto,
  CancelRateLockDto,
} from './dto/rate-lock.dto';
import { CreateLoanDisbursementDto } from '../loan-disbursement/dto/create-loan-disbursement.dto';

@ApiTags('Loan Booking & Disbursement')
@ApiBearerAuth('JWT-auth')
@Controller('loan-booking')
export class LoanBookingController {
  constructor(
    private readonly loanBookingService: LoanBookingService,
    private readonly rateLockService: RateLockService,
    private readonly disbursementWorkflowService: DisbursementWorkflowService,
  ) {}

  // UC-011: Loan Approval & Booking
  @Post('bookings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create loan booking from approved application (UC-011)' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  async createBooking(@Body() createDto: CreateLoanBookingDto, @Request() req: any) {
    return await this.loanBookingService.createBooking(createDto, req.user.id);
  }

  @Post('bookings/:bookingId/generate-documents')
  @ApiOperation({ summary: 'Generate loan documents' })
  @ApiResponse({ status: 200, description: 'Documents generated' })
  async generateDocuments(@Param('bookingId') bookingId: string, @Request() req: any) {
    return await this.loanBookingService.generateDocuments(bookingId, req.user.id);
  }

  @Post('documents/:documentId/signature-request')
  @ApiOperation({ summary: 'Create signature request for document' })
  @ApiResponse({ status: 201, description: 'Signature request created' })
  async createSignatureRequest(
    @Param('documentId') documentId: string,
    @Body() createDto: CreateLoanSignatureDto,
  ) {
    return await this.loanBookingService.createSignatureRequest(documentId, createDto);
  }

  @Post('signatures/:signatureId/sign')
  @ApiOperation({ summary: 'Sign document (e-signature or digital)' })
  @ApiResponse({ status: 200, description: 'Document signed' })
  async signDocument(
    @Param('signatureId') signatureId: string,
    @Body() signDto: SignDocumentDto,
  ) {
    return await this.loanBookingService.signDocument(signatureId, signDto);
  }

  @Post('signatures/:signatureId/notarize')
  @ApiOperation({ summary: 'Notarize document' })
  @ApiResponse({ status: 200, description: 'Document notarized' })
  async notarizeDocument(
    @Param('signatureId') signatureId: string,
    @Body() notarizeDto: NotarizeDocumentDto,
  ) {
    return await this.loanBookingService.notarizeDocument(signatureId, notarizeDto);
  }

  @Post('bookings/:bookingId/complete')
  @ApiOperation({ summary: 'Complete loan booking (create account and finalize)' })
  @ApiResponse({ status: 200, description: 'Booking completed' })
  async completeBooking(@Param('bookingId') bookingId: string, @Request() req: any) {
    return await this.loanBookingService.completeBooking(bookingId, req.user.id);
  }

  @Get('bookings/:bookingId')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved' })
  async getBooking(@Param('bookingId') bookingId: string) {
    return await this.loanBookingService.getBooking(bookingId);
  }

  @Get('loans/:loanId/booking')
  @ApiOperation({ summary: 'Get booking for loan' })
  @ApiResponse({ status: 200, description: 'Booking retrieved' })
  async getBookingForLoan(@Param('loanId') loanId: string) {
    return await this.loanBookingService.getBookingForLoan(loanId);
  }

  @Put('bookings/:bookingId')
  @ApiOperation({ summary: 'Update booking' })
  @ApiResponse({ status: 200, description: 'Booking updated' })
  async updateBooking(
    @Param('bookingId') bookingId: string,
    @Body() updateDto: UpdateLoanBookingDto,
  ) {
    return await this.loanBookingService.updateBooking(bookingId, updateDto);
  }

  @Post('bookings/:bookingId/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  async cancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() cancelDto: CancelLoanBookingDto,
    @Request() req: any,
  ) {
    return await this.loanBookingService.cancelBooking(bookingId, cancelDto, req.user.id);
  }

  // UC-012: Loan Disbursement
  @Get('loans/:loanId/disbursement-readiness')
  @ApiOperation({ summary: 'Check disbursement readiness (UC-012)' })
  @ApiResponse({ status: 200, description: 'Readiness status retrieved' })
  async getDisbursementReadiness(@Param('loanId') loanId: string) {
    return await this.disbursementWorkflowService.getDisbursementReadiness(loanId);
  }

  @Post('loans/:loanId/initiate-disbursement')
  @ApiOperation({ summary: 'Initiate disbursement with condition verification' })
  @ApiResponse({ status: 201, description: 'Disbursement initiated' })
  async initiateDisbursement(
    @Param('loanId') loanId: string,
    @Body() createDto: CreateLoanDisbursementDto,
    @Request() req: any,
  ) {
    return await this.disbursementWorkflowService.initiateDisbursement(loanId, createDto, req.user.id);
  }

  @Post('disbursements/:disbursementId/record-transaction')
  @ApiOperation({ summary: 'Record disbursement transaction' })
  @ApiResponse({ status: 200, description: 'Transaction recorded' })
  async recordDisbursementTransaction(@Param('disbursementId') disbursementId: string) {
    return await this.disbursementWorkflowService.recordDisbursementTransaction(disbursementId);
  }

  // UC-013: Rate Lock Management
  @Post('rate-locks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request rate lock (UC-013)' })
  @ApiResponse({ status: 201, description: 'Rate lock requested' })
  async requestRateLock(@Body() createDto: CreateRateLockDto, @Request() req: any) {
    return await this.rateLockService.requestRateLock(createDto, req.user.id);
  }

  @Post('rate-locks/:rateLockId/approve')
  @ApiOperation({ summary: 'Approve rate lock' })
  @ApiResponse({ status: 200, description: 'Rate lock approved' })
  async approveRateLock(
    @Param('rateLockId') rateLockId: string,
    @Body() body: { remarks?: string },
    @Request() req: any,
  ) {
    return await this.rateLockService.approveRateLock(rateLockId, req.user.id, body.remarks);
  }

  @Post('rate-locks/:rateLockId/extend')
  @ApiOperation({ summary: 'Extend rate lock' })
  @ApiResponse({ status: 200, description: 'Rate lock extended' })
  async extendRateLock(
    @Param('rateLockId') rateLockId: string,
    @Body() extendDto: ExtendRateLockDto,
    @Request() req: any,
  ) {
    return await this.rateLockService.extendRateLock(rateLockId, extendDto, req.user.id);
  }

  @Post('rate-locks/:rateLockId/float-down')
  @ApiOperation({ summary: 'Exercise float-down option' })
  @ApiResponse({ status: 200, description: 'Float-down exercised' })
  async exerciseFloatDown(
    @Param('rateLockId') rateLockId: string,
    @Body() floatDownDto: ExerciseFloatDownDto,
  ) {
    return await this.rateLockService.exerciseFloatDown(rateLockId, floatDownDto);
  }

  @Post('rate-locks/:rateLockId/cancel')
  @ApiOperation({ summary: 'Cancel rate lock' })
  @ApiResponse({ status: 200, description: 'Rate lock cancelled' })
  async cancelRateLock(
    @Param('rateLockId') rateLockId: string,
    @Body() cancelDto: CancelRateLockDto,
    @Request() req: any,
  ) {
    return await this.rateLockService.cancelRateLock(rateLockId, cancelDto, req.user.id);
  }

  @Get('rate-locks/:rateLockId')
  @ApiOperation({ summary: 'Get rate lock by ID' })
  @ApiResponse({ status: 200, description: 'Rate lock retrieved' })
  async getRateLock(@Param('rateLockId') rateLockId: string) {
    return await this.rateLockService.getRateLock(rateLockId);
  }

  @Get('loans/:loanId/rate-locks')
  @ApiOperation({ summary: 'Get rate locks for loan' })
  @ApiResponse({ status: 200, description: 'Rate locks retrieved' })
  async getRateLocksForLoan(@Param('loanId') loanId: string) {
    return await this.rateLockService.getRateLocksForLoan(loanId);
  }

  @Get('applications/:applicationId/rate-locks')
  @ApiOperation({ summary: 'Get rate locks for application' })
  @ApiResponse({ status: 200, description: 'Rate locks retrieved' })
  async getRateLocksForApplication(@Param('applicationId') applicationId: string) {
    return await this.rateLockService.getRateLocksForApplication(applicationId);
  }

  @Get('loans/:loanId/active-rate-lock')
  @ApiOperation({ summary: 'Get active rate lock for loan' })
  @ApiResponse({ status: 200, description: 'Active rate lock retrieved' })
  async getActiveRateLock(@Param('loanId') loanId: string) {
    return await this.rateLockService.getActiveRateLock(loanId);
  }

  @Get('rate-locks/:rateLockId/float-down-eligibility')
  @ApiOperation({ summary: 'Check float-down eligibility' })
  @ApiResponse({ status: 200, description: 'Eligibility checked' })
  async checkFloatDownEligibility(@Param('rateLockId') rateLockId: string) {
    return await this.rateLockService.checkFloatDownEligibility(rateLockId);
  }
}

