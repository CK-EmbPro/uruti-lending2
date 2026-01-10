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
import { PaymentReminderService } from './services/payment-reminder.service';
import { AutopayService } from './services/autopay.service';
import { PaymentReversalService } from './services/payment-reversal.service';
import { PartialPaymentService } from './services/partial-payment.service';
import { PaymentAllocationService } from './services/payment-allocation.service';
import {
  CreatePaymentReminderDto,
  UpdatePaymentReminderDto,
} from './dto/payment-reminder.dto';
import {
  CreateAutopayEnrollmentDto,
  UpdateAutopayEnrollmentDto,
  CancelAutopayDto,
} from './dto/autopay.dto';
import {
  CreatePaymentReversalDto,
  UpdatePaymentReversalDto,
} from './dto/payment-reversal.dto';
import {
  CreatePartialPaymentDto,
  ApplyPartialPaymentDto,
} from './dto/partial-payment.dto';
import { CreatePaymentAllocationDto } from './dto/payment-allocation.dto';

@ApiTags('Payment Processing')
@ApiBearerAuth('JWT-auth')
@Controller('payment-processing')
export class PaymentProcessingController {
  constructor(
    private readonly reminderService: PaymentReminderService,
    private readonly autopayService: AutopayService,
    private readonly reversalService: PaymentReversalService,
    private readonly partialPaymentService: PartialPaymentService,
    private readonly allocationService: PaymentAllocationService,
  ) {}

  // UC-014: Regular Payment Processing - Reminders
  @Post('reminders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create payment reminder (UC-014)' })
  @ApiResponse({ status: 201, description: 'Reminder created' })
  async createReminder(@Body() createDto: CreatePaymentReminderDto) {
    return await this.reminderService.createReminder(createDto);
  }

  @Post('reminders/:reminderId/send')
  @ApiOperation({ summary: 'Send payment reminder' })
  @ApiResponse({ status: 200, description: 'Reminder sent' })
  async sendReminder(@Param('reminderId') reminderId: string) {
    return await this.reminderService.sendReminder(reminderId);
  }

  @Post('reminders/:reminderId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge payment reminder' })
  @ApiResponse({ status: 200, description: 'Reminder acknowledged' })
  async acknowledgeReminder(@Param('reminderId') reminderId: string) {
    return await this.reminderService.acknowledgeReminder(reminderId);
  }

  @Get('loans/:loanId/reminders')
  @ApiOperation({ summary: 'Get payment reminders for loan' })
  @ApiResponse({ status: 200, description: 'Reminders retrieved' })
  async getRemindersForLoan(@Param('loanId') loanId: string) {
    return await this.reminderService.getRemindersForLoan(loanId);
  }

  // UC-015: Autopay Enrollment & Processing
  @Post('autopay/enroll')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enroll in autopay (UC-015)' })
  @ApiResponse({ status: 201, description: 'Enrollment created' })
  async enrollAutopay(@Body() createDto: CreateAutopayEnrollmentDto, @Request() req: any) {
    return await this.autopayService.enroll(createDto, req.user.id);
  }

  @Post('autopay/:enrollmentId/verify')
  @ApiOperation({ summary: 'Verify bank account' })
  @ApiResponse({ status: 200, description: 'Account verified' })
  async verifyAccount(@Param('enrollmentId') enrollmentId: string) {
    return await this.autopayService.verifyAccount(enrollmentId);
  }

  @Post('autopay/:enrollmentId/process')
  @ApiOperation({ summary: 'Process autopay payment' })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  async processAutopay(@Param('enrollmentId') enrollmentId: string) {
    return await this.autopayService.processAutopay(enrollmentId);
  }

  @Post('autopay/:enrollmentId/cancel')
  @ApiOperation({ summary: 'Cancel autopay' })
  @ApiResponse({ status: 200, description: 'Autopay cancelled' })
  async cancelAutopay(
    @Param('enrollmentId') enrollmentId: string,
    @Body() cancelDto: CancelAutopayDto,
    @Request() req: any,
  ) {
    return await this.autopayService.cancel(enrollmentId, cancelDto, req.user.id);
  }

  @Get('loans/:loanId/autopay')
  @ApiOperation({ summary: 'Get autopay enrollment for loan' })
  @ApiResponse({ status: 200, description: 'Enrollment retrieved' })
  async getAutopayForLoan(@Param('loanId') loanId: string) {
    return await this.autopayService.getEnrollmentForLoan(loanId);
  }

  // UC-016: Early/Extra Payment - Allocation
  @Post('allocations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Allocate payment with preference (UC-016)' })
  @ApiResponse({ status: 201, description: 'Allocation created' })
  async allocatePayment(@Body() createDto: CreatePaymentAllocationDto) {
    return await this.allocationService.allocatePayment(createDto);
  }

  @Get('repayments/:repaymentId/allocation')
  @ApiOperation({ summary: 'Get allocation for repayment' })
  @ApiResponse({ status: 200, description: 'Allocation retrieved' })
  async getAllocationForRepayment(@Param('repaymentId') repaymentId: string) {
    return await this.allocationService.getAllocationForRepayment(repaymentId);
  }

  // UC-017: Payment Reversal
  @Post('reversals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create payment reversal (UC-017)' })
  @ApiResponse({ status: 201, description: 'Reversal created' })
  async createReversal(@Body() createDto: CreatePaymentReversalDto, @Request() req: any) {
    return await this.reversalService.createReversal(createDto, req.user.id);
  }

  @Post('reversals/:reversalId/process')
  @ApiOperation({ summary: 'Process payment reversal' })
  @ApiResponse({ status: 200, description: 'Reversal processed' })
  async processReversal(
    @Param('reversalId') reversalId: string,
    @Body() body: { notifyBorrower?: boolean; initiateCollection?: boolean },
    @Request() req: any,
  ) {
    return await this.reversalService.processReversal(reversalId, req.user.id, body);
  }

  @Get('reversals/:reversalId')
  @ApiOperation({ summary: 'Get reversal by ID' })
  @ApiResponse({ status: 200, description: 'Reversal retrieved' })
  async getReversal(@Param('reversalId') reversalId: string) {
    return await this.reversalService.getReversal(reversalId);
  }

  @Get('loans/:loanId/reversals')
  @ApiOperation({ summary: 'Get reversals for loan' })
  @ApiResponse({ status: 200, description: 'Reversals retrieved' })
  async getReversalsForLoan(@Param('loanId') loanId: string) {
    return await this.reversalService.getReversalsForLoan(loanId);
  }

  // UC-018: Partial Payment Handling
  @Post('partial-payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create partial payment (UC-018)' })
  @ApiResponse({ status: 201, description: 'Partial payment created' })
  async createPartialPayment(@Body() createDto: CreatePartialPaymentDto) {
    return await this.partialPaymentService.createPartialPayment(createDto);
  }

  @Post('partial-payments/:partialPaymentId/apply')
  @ApiOperation({ summary: 'Apply partial payment' })
  @ApiResponse({ status: 200, description: 'Payment applied' })
  async applyPartialPayment(
    @Param('partialPaymentId') partialPaymentId: string,
    @Body() applyDto: ApplyPartialPaymentDto,
  ) {
    return await this.partialPaymentService.applyPartialPayment(partialPaymentId, applyDto);
  }

  @Get('loans/:loanId/partial-payments')
  @ApiOperation({ summary: 'Get partial payments for loan' })
  @ApiResponse({ status: 200, description: 'Partial payments retrieved' })
  async getPartialPaymentsForLoan(@Param('loanId') loanId: string) {
    return await this.partialPaymentService.getPartialPaymentsForLoan(loanId);
  }

  @Get('loans/:loanId/partial-payments/suspense')
  @ApiOperation({ summary: 'Get partial payments in suspense' })
  @ApiResponse({ status: 200, description: 'Suspense payments retrieved' })
  async getSuspensePayments(@Param('loanId') loanId: string) {
    return await this.partialPaymentService.getSuspensePayments(loanId);
  }
}

