import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRepayment } from '../entities/loan-repayment.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { EmailService } from '../../email/email.service';
import { QRCodeService } from '../../qrcode/qrcode.service';
import { PDFService } from '../../pdf/pdf.service';
import { ExcelService } from '../../excel/excel.service';

/**
 * Service to integrate new platform services with loan repayment workflows
 * Enhances repayment processing with email, PDF, QR codes, and Excel exports
 */
@Injectable()
export class RepaymentIntegrationService {
  private readonly logger = new Logger(RepaymentIntegrationService.name);

  constructor(
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly emailService: EmailService,
    private readonly qrcodeService: QRCodeService,
    private readonly pdfService: PDFService,
    private readonly excelService: ExcelService,
  ) {}

  /**
   * Send payment receipt via email with PDF attachment
   */
  async sendPaymentReceipt(repaymentId: string): Promise<void> {
    const repayment = await this.repaymentRepository.findOne({
      where: { id: repaymentId },
      relations: ['loan'],
    });

    if (!repayment) {
      throw new Error(`Repayment ${repaymentId} not found`);
    }

    const loan = repayment.loan;
    if (!loan) {
      throw new Error(`Loan not found for repayment ${repaymentId}`);
    }

    // Generate payment receipt PDF
    const receiptPdf = await this.pdfService.generatePDF((doc) => {
      doc.fontSize(20).text('Payment Receipt', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Receipt Number: ${repayment.referenceNumber || repayment.id}`);
      doc.text(`Loan Number: ${loan.loanNumber}`);
      doc.text(`Payment Date: ${repayment.postingDate}`);
      doc.moveDown();
      doc.text('Payment Details:', { underline: true });
      doc.text(`Amount Paid: $${(repayment.amountPaid || 0).toLocaleString()}`);
      doc.text(`Principal: $${(repayment.principalPaid || 0).toLocaleString()}`);
      doc.text(`Interest: $${(repayment.interestPaid || 0).toLocaleString()}`);
      doc.text(`Penalty: $${(repayment.penaltyPaid || 0).toLocaleString()}`);
      doc.moveDown();
      doc.text(`Payment Method: ${repayment.modeOfPayment || 'N/A'}`);
      doc.text(`Reference: ${repayment.referenceNumber || 'N/A'}`);
    });

    // Generate QR code for payment tracking
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/repayments/${repaymentId}`;
    const qrCode = await this.qrcodeService.generateDataURL(trackingUrl, {
      width: 150,
      errorCorrectionLevel: 'M',
    });

    // Get customer email (would need to fetch from Customer entity)
    const customerEmail = loan.applicantEmail || '';

    if (customerEmail) {
      await this.emailService.sendEmail({
        to: customerEmail,
        subject: `Payment Receipt - ${repayment.referenceNumber || repayment.id}`,
        html: `
          <h2>Payment Receipt</h2>
          <p>Thank you for your payment.</p>
          <p><strong>Receipt Number:</strong> ${repayment.referenceNumber || repayment.id}</p>
          <p><strong>Loan Number:</strong> ${loan.loanNumber}</p>
          <p><strong>Amount Paid:</strong> $${(repayment.amountPaid || 0).toLocaleString()}</p>
          <p><strong>Payment Date:</strong> ${repayment.postingDate}</p>
          <p>You can track this payment using the QR code below:</p>
          <img src="${qrCode}" alt="Payment QR Code" />
          <p><a href="${trackingUrl}">View Payment Details</a></p>
        `,
        attachments: [
          {
            filename: `receipt-${repayment.referenceNumber || repayment.id}.pdf`,
            content: receiptPdf,
          },
        ],
      });

      this.logger.log(`Payment receipt sent for repayment ${repaymentId}`);
    }
  }

  /**
   * Generate payment QR code for future payments
   */
  async generatePaymentQRCode(loanId: string, amount: number): Promise<string> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/${loanId}?amount=${amount}`;
    
    const qrCode = await this.qrcodeService.generateDataURL(paymentUrl, {
      width: 200,
    });

    return qrCode;
  }

  /**
   * Export repayment history to Excel
   */
  async exportRepaymentHistory(loanId: string): Promise<Buffer> {
    const repayments = await this.repaymentRepository.find({
      where: { loanId },
      order: { postingDate: 'DESC' },
    });

    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    const data = repayments.map((repayment) => ({
      'Date': repayment.postingDate,
      'Reference Number': repayment.referenceNumber || '',
      'Amount Paid': repayment.amountPaid || 0,
      'Principal': repayment.principalPaid || 0,
      'Interest': repayment.interestPaid || 0,
      'Penalty': repayment.penaltyPaid || 0,
      'Payment Method': repayment.modeOfPayment || '',
      'Status': repayment.status || '',
    }));

    const excelBuffer = await this.excelService.generateExcel(data, {
      filename: `repayment-history-${loan?.loanNumber || loanId}`,
      sheetName: 'Repayment History',
    });

    return excelBuffer;
  }

  /**
   * Send payment reminder with QR code
   */
  async sendPaymentReminderWithQR(loanId: string, amountDue: number, dueDate: Date): Promise<void> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    // Generate payment QR code
    const qrCode = await this.generatePaymentQRCode(loanId, amountDue);

    // Send email reminder
    await this.emailService.sendPaymentReminder(loan.applicantEmail || '', {
      loanId: loan.id,
      customerName: loan.applicantId || 'Customer',
      amountDue,
      dueDate: dueDate.toISOString().split('T')[0],
      paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/${loanId}`,
    });

    this.logger.log(`Payment reminder with QR code sent for loan ${loanId}`);
  }
}

