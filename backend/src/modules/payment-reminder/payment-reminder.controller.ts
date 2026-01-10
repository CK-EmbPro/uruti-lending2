import {
  Controller,
  Get,
  Post,
  Body,
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
import { PaymentReminderService } from './services/payment-reminder.service';
import { PaymentReminderIntegrationService } from './services/payment-reminder-integration.service';
import { SendPaymentReminderDto } from './dto/payment-reminder.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('payment-reminders')
@ApiBearerAuth('JWT-auth')
@Controller('payment-reminders')
@UseGuards(CompanyGuard)
export class PaymentReminderController {
  constructor(
    private readonly paymentReminderService: PaymentReminderService,
    private readonly paymentReminderIntegrationService: PaymentReminderIntegrationService,
  ) {}

  @Post('loan/:loanId/schedule')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Schedule reminders for a loan',
    description: 'Automatically schedules payment reminders for all upcoming repayments of a loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({
    status: 201,
    description: 'Reminders scheduled successfully',
  })
  async scheduleReminders(
    @Param('loanId') loanId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.paymentReminderService.scheduleRemindersForLoan(loanId, companyId);
    return { message: 'Reminders scheduled successfully' };
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send payment reminder immediately',
    description: 'Sends a payment reminder immediately for a specific repayment schedule',
  })
  @ApiBody({ type: SendPaymentReminderDto })
  @ApiResponse({
    status: 200,
    description: 'Reminder sent successfully',
  })
  async sendReminder(
    @Body() dto: SendPaymentReminderDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.paymentReminderService.sendReminder(dto, companyId);
  }

  @Get('loan/:loanId')
  @ApiOperation({
    summary: 'Get reminders for a loan',
    description: 'Retrieves all payment reminders for a specific loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminders retrieved successfully',
  })
  async getReminders(
    @Param('loanId') loanId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.paymentReminderService.getRemindersForLoan(loanId, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancel a reminder',
    description: 'Cancels a pending payment reminder',
  })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({
    status: 204,
    description: 'Reminder cancelled successfully',
  })
  async cancelReminder(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.paymentReminderService.cancelReminder(id, companyId);
  }

  // Integration Service Endpoints

  @Post(':id/send-with-pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send payment reminder with PDF',
    description: 'Sends payment reminder email with PDF attachment and QR code',
  })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loanId: { type: 'string' },
        amountDue: { type: 'number' },
        dueDate: { type: 'string', format: 'date' },
        reminderType: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Reminder sent with PDF successfully' })
  async sendReminderWithPDF(
    @Param('id') id: string,
    @Body() body: { loanId: string; amountDue: number; dueDate: string; reminderType: string },
  ) {
    await this.paymentReminderIntegrationService.sendPaymentReminderWithPDF(
      id,
      body.loanId,
      body.amountDue,
      new Date(body.dueDate),
      body.reminderType as any,
    );
    return { success: true, message: 'Payment reminder sent with PDF' };
  }

  @Get('loans/:loanId/payment-schedule-pdf')
  @ApiOperation({
    summary: 'Generate payment schedule PDF',
    description: 'Generates payment schedule PDF with QR code for loan tracking',
  })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({ status: 200, description: 'Payment schedule PDF generated successfully' })
  async getPaymentSchedulePDF(@Param('loanId') loanId: string) {
    const result = await this.paymentReminderIntegrationService.generatePaymentSchedulePDF(loanId);
    return {
      success: true,
      pdf: result.pdf.toString('base64'),
      qrCode: result.qrCode,
    };
  }
}

