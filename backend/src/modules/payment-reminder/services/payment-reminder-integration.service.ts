import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentReminder } from '../entities/payment-reminder.entity';
import { LoanRepaymentSchedule, ScheduleEntryStatus } from '../../loan/entities/loan-repayment-schedule.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { EmailService } from '../../email/email.service';
import { QRCodeService } from '../../qrcode/qrcode.service';
import { PDFService } from '../../pdf/pdf.service';
import { ReminderType } from '../dto/payment-reminder.dto';

/**
 * Service to integrate new platform services with payment reminder workflows
 * Enhances payment reminders with email templates, PDF, and QR codes
 */
@Injectable()
export class PaymentReminderIntegrationService {
  private readonly logger = new Logger(PaymentReminderIntegrationService.name);

  constructor(
    @InjectRepository(PaymentReminder)
    private readonly reminderRepository: Repository<PaymentReminder>,
    @InjectRepository(LoanRepaymentSchedule)
    private readonly scheduleRepository: Repository<LoanRepaymentSchedule>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly emailService: EmailService,
    private readonly qrcodeService: QRCodeService,
    private readonly pdfService: PDFService,
  ) {}

  /**
   * Send payment reminder with PDF and QR code
   */
  async sendPaymentReminderWithPDF(
    reminderId: string,
    loanId: string,
    amountDue: number,
    dueDate: Date,
    reminderType: ReminderType,
  ): Promise<void> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    // Generate payment reminder PDF
    const reminderPdf = await this.pdfService.generatePDF((doc) => {
      doc.fontSize(20).text('Payment Reminder', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Loan Number: ${loan.loanNumber}`);
      doc.text(`Customer: Customer`); // Applicant name not stored in Loan entity
      doc.moveDown();
      doc.text('Payment Information:', { underline: true });
      doc.text(`Amount Due: $${amountDue.toLocaleString()}`);
      doc.text(`Due Date: ${dueDate.toLocaleDateString()}`);
      doc.text(`Reminder Type: ${reminderType}`);
      doc.moveDown();
      doc.text('Please make your payment on or before the due date.');
      doc.text('You can use the QR code below to make a payment.');
    });

    // Generate payment QR code
    const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/${loanId}?amount=${amountDue}`;
    const qrCode = await this.qrcodeService.generate(paymentUrl, {
      width: 200,
    });

    // Get customer email
    const customerEmail = loan.applicantEmail || '';

    if (customerEmail) {
      const subject = this.getReminderSubject(reminderType, dueDate);
      
      // Use payment reminder template
      await this.emailService.sendPaymentReminder(customerEmail, {
        loanId: loan.id,
        customerName: 'Customer', // Applicant name not stored in Loan entity
        amountDue,
        dueDate: dueDate.toISOString().split('T')[0],
        paymentLink: paymentUrl,
      });

      // Also send with PDF attachment
      await this.emailService.sendEmail({
        to: customerEmail,
        subject,
        html: `
          <h2>Payment Reminder</h2>
          <p><strong>Loan Number:</strong> ${loan.loanNumber}</p>
          <p><strong>Amount Due:</strong> $${amountDue.toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
          <p>Please make your payment on or before the due date.</p>
          <p>You can use the QR code below to make a payment:</p>
          <img src="${qrCode.dataUrl}" alt="Payment QR Code" />
          <p><a href="${paymentUrl}">Make Payment Online</a></p>
        `,
        attachments: [
          {
            filename: `payment-reminder-${loan.loanNumber}-${dueDate.toISOString().split('T')[0]}.pdf`,
            content: reminderPdf,
          },
        ],
      });

      this.logger.log(`Payment reminder sent with PDF for reminder ${reminderId}`);
    }
  }

  /**
   * Generate payment schedule PDF with QR codes
   */
  async generatePaymentSchedulePDF(loanId: string): Promise<{ pdf: Buffer; qrCode: string }> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['repaymentSchedules'],
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    const schedules = loan.repaymentSchedule || [];
    const upcomingSchedules = schedules
      .filter((s) => s.status === ScheduleEntryStatus.PENDING)
      .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
      .slice(0, 12); // Next 12 payments

    // Generate PDF
    const pdfBuffer = await this.pdfService.generatePDF((doc) => {
      doc.fontSize(20).text('Payment Schedule', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Loan Number: ${loan.loanNumber}`);
      doc.text(`Customer: Customer`); // Applicant name not stored in Loan entity
      doc.moveDown();
      doc.text('Upcoming Payments:', { underline: true });
      doc.moveDown(0.5);

      let y = doc.y;
      doc.fontSize(10);
      doc.text('Date', 50, y);
      doc.text('Amount', 200, y);
      doc.text('Principal', 300, y);
      doc.text('Interest', 400, y);
      doc.text('Status', 500, y);

      y += 20;
      upcomingSchedules.forEach((schedule) => {
        doc.text(schedule.paymentDate.toLocaleDateString(), 50, y);
        doc.text(`$${(schedule.principalAmount + schedule.interestAmount).toFixed(2)}`, 200, y);
        doc.text(`$${schedule.principalAmount.toFixed(2)}`, 300, y);
        doc.text(`$${schedule.interestAmount.toFixed(2)}`, 400, y);
        doc.text(schedule.status, 500, y);
        y += 15;
      });
    });

    // Generate QR code for loan tracking
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/loans/${loanId}`;
    const qrCode = await this.qrcodeService.generate(trackingUrl, {
      width: 200,
    });

    return {
      pdf: pdfBuffer,
      qrCode: qrCode.dataUrl,
    };
  }

  /**
   * Get reminder subject based on type
   */
  private getReminderSubject(reminderType: ReminderType, dueDate: Date): string {
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    switch (reminderType) {
      case ReminderType.UPCOMING:
        return `Payment Reminder - Due in ${daysUntilDue} Days`;
      case ReminderType.DUE_TODAY:
        return `Payment Due Today - Action Required`;
      case ReminderType.OVERDUE:
        return `Payment Overdue - Immediate Action Required`;
      case ReminderType.FINAL_NOTICE:
        return `Final Payment Notice - Urgent Action Required`;
      default:
        return `Payment Reminder - Due ${dueDate.toLocaleDateString()}`;
    }
  }
}

