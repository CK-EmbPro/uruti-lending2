import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
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
import { LoanRestructureService } from './loan-restructure.service';
import { RestructureAcknowledgmentService } from './services/restructure-acknowledgment.service';
import { PaymentHolidayTrackingService } from './services/payment-holiday-tracking.service';
import { CreateLoanRestructureDto } from './dto/create-loan-restructure.dto';
import { UpdateLoanRestructureDto } from './dto/update-loan-restructure.dto';
import { AcknowledgeRestructureDto } from './dto/acknowledge-restructure.dto';

@ApiTags('loan-restructures')
@ApiBearerAuth('JWT-auth')
@Controller('loan-restructures')
export class LoanRestructureController {
  constructor(
    private readonly restructureService: LoanRestructureService,
    private readonly acknowledgmentService: RestructureAcknowledgmentService,
    private readonly paymentHolidayTrackingService: PaymentHolidayTrackingService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create loan restructure',
    description: 'Creates a new loan restructure request',
  })
  @ApiBody({ type: CreateLoanRestructureDto })
  @ApiResponse({
    status: 201,
    description: 'Loan restructure created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  create(@Body() createDto: CreateLoanRestructureDto) {
    return this.restructureService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all loan restructures',
    description: 'Retrieves a list of all loan restructures',
  })
  @ApiQuery({
    name: 'loanId',
    required: false,
    description: 'Filter by loan ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of restructures retrieved successfully',
  })
  findAll(@Query('loanId') loanId?: string) {
    return this.restructureService.findAll(loanId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get loan restructure by ID',
    description: 'Retrieves a specific loan restructure by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Restructure UUID', type: String })
  @ApiResponse({ status: 200, description: 'Restructure found' })
  @ApiResponse({ status: 404, description: 'Restructure not found' })
  findOne(@Param('id') id: string) {
    return this.restructureService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update loan restructure',
    description: 'Updates a loan restructure (only in INITIATED status)',
  })
  @ApiParam({ name: 'id', description: 'Restructure UUID', type: String })
  @ApiBody({ type: UpdateLoanRestructureDto })
  @ApiResponse({
    status: 200,
    description: 'Restructure updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Restructure not found' })
  @ApiResponse({ status: 400, description: 'Cannot update (not in INITIATED status)' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLoanRestructureDto,
  ) {
    return this.restructureService.update(id, updateDto);
  }

  @Post(':id/approve')
  @ApiOperation({
    summary: 'Approve loan restructure',
    description:
      'Approves a loan restructure and applies changes to the loan (waivers, adjustments, new terms)',
  })
  @ApiParam({ name: 'id', description: 'Restructure UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Restructure approved and changes applied successfully',
  })
  @ApiResponse({ status: 404, description: 'Restructure not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot approve (not in INITIATED status)',
  })
  approve(@Param('id') id: string) {
    return this.restructureService.approve(id);
  }

  @Post(':id/reject')
  @ApiOperation({
    summary: 'Reject loan restructure',
    description: 'Rejects a loan restructure request',
  })
  @ApiParam({ name: 'id', description: 'Restructure UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Restructure rejected successfully',
  })
  @ApiResponse({ status: 404, description: 'Restructure not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot reject (not in INITIATED status)',
  })
  reject(@Param('id') id: string) {
    return this.restructureService.reject(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete loan restructure',
    description: 'Deletes a loan restructure (only in INITIATED status)',
  })
  @ApiParam({ name: 'id', description: 'Restructure UUID', type: String })
  @ApiResponse({
    status: 204,
    description: 'Restructure deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Restructure not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete (not in INITIATED status)',
  })
  remove(@Param('id') id: string) {
    return this.restructureService.remove(id);
  }

  @Post(':id/acknowledge')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Acknowledge restructure terms',
    description: 'Records borrower acknowledgment of restructure terms change',
  })
  @ApiParam({ name: 'id', description: 'Restructure UUID', type: String })
  @ApiBody({ type: AcknowledgeRestructureDto })
  @ApiResponse({
    status: 201,
    description: 'Acknowledgment recorded successfully',
  })
  @ApiResponse({ status: 404, description: 'Restructure not found' })
  @ApiResponse({
    status: 400,
    description: 'Restructure already acknowledged or invalid data',
  })
  async acknowledge(
    @Param('id') id: string,
    @Body() acknowledgeDto: AcknowledgeRestructureDto,
    @Query('borrowerId') borrowerId: string,
  ) {
    return this.acknowledgmentService.recordAcknowledgment(
      id,
      borrowerId,
      acknowledgeDto.acknowledgmentMethod,
      acknowledgeDto.acknowledgmentText,
      {
        ipAddress: acknowledgeDto.ipAddress,
        userAgent: acknowledgeDto.userAgent,
        signatureData: acknowledgeDto.signatureData,
        termsRead: acknowledgeDto.termsRead,
        impactUnderstood: acknowledgeDto.impactUnderstood,
        notes: acknowledgeDto.notes,
      },
    );
  }

  @Get(':id/acknowledgment')
  @ApiOperation({
    summary: 'Get restructure acknowledgment',
    description: 'Retrieves acknowledgment details for a restructure',
  })
  @ApiParam({ name: 'id', description: 'Restructure UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Acknowledgment found',
  })
  @ApiResponse({ status: 404, description: 'Acknowledgment not found' })
  getAcknowledgment(@Param('id') id: string) {
    return this.acknowledgmentService.getAcknowledgment(id);
  }

  @Get('loans/:loanId/payment-holidays')
  @ApiOperation({
    summary: 'Get payment holidays for a loan',
    description: 'Retrieves all payment holidays for a specific loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Payment holidays retrieved successfully',
  })
  getPaymentHolidays(@Param('loanId') loanId: string) {
    return this.paymentHolidayTrackingService.getPaymentHolidays(loanId);
  }

  @Get('loans/:loanId/payment-holidays/count')
  @ApiOperation({
    summary: 'Get payment holiday count for a loan',
    description: 'Returns the number of payment holidays for a loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Payment holiday count retrieved successfully',
  })
  getPaymentHolidayCount(@Param('loanId') loanId: string) {
    return this.paymentHolidayTrackingService.getPaymentHolidayCount(loanId);
  }
}

