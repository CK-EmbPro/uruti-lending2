import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/email.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email' })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
  })
  async sendEmail(@Body() dto: SendEmailDto): Promise<{ success: boolean; message: string }> {
    await this.emailService.sendEmail({
      to: dto.to,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
      template: dto.template,
      context: dto.context,
      cc: dto.cc,
      bcc: dto.bcc,
    });

    return {
      success: true,
      message: 'Email sent successfully',
    };
  }

  @Post('payment-reminder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send payment reminder email' })
  @ApiResponse({
    status: 200,
    description: 'Payment reminder sent successfully',
  })
  async sendPaymentReminder(
    @Body()
    dto: {
      email: string;
      loanId: string;
      customerName: string;
      amountDue: number;
      dueDate: string;
      paymentLink?: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    await this.emailService.sendPaymentReminder(dto.email, {
      loanId: dto.loanId,
      customerName: dto.customerName,
      amountDue: dto.amountDue,
      dueDate: dto.dueDate,
      paymentLink: dto.paymentLink,
    });

    return {
      success: true,
      message: 'Payment reminder sent successfully',
    };
  }
}
