import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanDisbursement } from '../entities/loan-disbursement.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { EmailService } from '../../email/email.service';
import { QRCodeService } from '../../qrcode/qrcode.service';
import { PDFService } from '../../pdf/pdf.service';

/**
 * Service to integrate new platform services with loan disbursement workflows
 * Enhances disbursement with email notifications, PDF documents, and QR codes
 */
@Injectable()
export class DisbursementIntegrationService {
  private readonly logger = new Logger(DisbursementIntegrationService.name);

  constructor(
    @InjectRepository(LoanDisbursement)
    private readonly disbursementRepository: Repository<LoanDisbursement>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly emailService: EmailService,
    private readonly qrcodeService: QRCodeService,
    private readonly pdfService: PDFService,
  ) {}

  /**
   * Send disbursement notification with PDF and QR code
   */
  async sendDisbursementNotification(disbursementId: string): Promise<void> {
    const disbursement = await this.disbursementRepository.findOne({
      where: { id: disbursementId },
      relations: ['loan'],
    });

    if (!disbursement) {
      throw new Error(`Disbursement ${disbursementId} not found`);
    }

    const loan = disbursement.loan;
    if (!loan) {
      throw new Error(`Loan not found for disbursement ${disbursementId}`);
    }

    // Generate disbursement document PDF
    const disbursementPdf = await this.pdfService.generatePDF((doc) => {
      doc.fontSize(20).text('Loan Disbursement Notice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Disbursement Reference: ${disbursement.referenceNumber || disbursement.id}`);
      doc.text(`Loan Number: ${loan.loanNumber}`);
      doc.text(`Disbursement Date: ${disbursement.disbursementDate}`);
      doc.moveDown();
      doc.text('Disbursement Details:', { underline: true });
      doc.text(`Amount Disbursed: $${(disbursement.disbursedAmount || 0).toLocaleString()}`);
      doc.text(`Disbursement Method: ${disbursement.modeOfPayment || 'N/A'}`);
      doc.text(`Reference Number: ${disbursement.referenceNumber || 'N/A'}`);
      doc.moveDown();
      doc.text(`Total Loan Amount: $${(loan.loanAmount || 0).toLocaleString()}`);
      doc.text(`Total Disbursed: $${(loan.disbursedAmount || 0).toLocaleString()}`);
      doc.text(`Remaining: $${((loan.loanAmount || 0) - (loan.disbursedAmount || 0)).toLocaleString()}`);
    });

    // Generate QR code for loan tracking
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/loans/${loan.id}`;
    const qrCode = await this.qrcodeService.generate(trackingUrl, {
      width: 200,
    });

    // Get customer email
    const customerEmail = loan.applicantEmail || '';

    if (customerEmail) {
      await this.emailService.sendEmail({
        to: customerEmail,
        subject: `Loan Disbursement - ${loan.loanNumber}`,
        html: `
          <h2>Loan Disbursement Confirmation</h2>
          <p>Your loan has been disbursed successfully.</p>
          <p><strong>Loan Number:</strong> ${loan.loanNumber}</p>
          <p><strong>Disbursement Amount:</strong> $${(disbursement.disbursedAmount || 0).toLocaleString()}</p>
          <p><strong>Disbursement Date:</strong> ${disbursement.disbursementDate}</p>
          <p><strong>Total Disbursed:</strong> $${(loan.disbursedAmount || 0).toLocaleString()}</p>
          <p>You can track your loan using the QR code below:</p>
          <img src="${qrCode.dataUrl}" alt="Loan QR Code" />
          <p><a href="${trackingUrl}">View Loan Details</a></p>
        `,
        attachments: [
          {
            filename: `disbursement-${disbursement.referenceNumber || disbursement.id}.pdf`,
            content: disbursementPdf,
          },
        ],
      });

      this.logger.log(`Disbursement notification sent for ${disbursementId}`);
    }
  }

  /**
   * Generate loan agreement PDF with QR code
   */
  async generateLoanAgreementPDF(loanId: string): Promise<{ pdf: Buffer; qrCode: string }> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateLoanAgreement({
      loanId: loan.id,
      customerName: 'Customer', // Applicant name not stored in Loan entity
      amount: loan.loanAmount || 0,
      interestRate: loan.rateOfInterest || 0,
      term: loan.repaymentPeriods || 12,
      terms: [
        `Loan Number: ${loan.loanNumber}`,
        `Loan Product: ${loan.loanProduct?.productName || 'Loan Product'}`,
        `Interest Rate: ${loan.rateOfInterest || 0}%`,
        `Repayment Periods: ${loan.repaymentPeriods || 12}`,
        `Repayment Frequency: ${loan.repaymentFrequency || 'Monthly'}`,
      ],
    });

    // Generate QR code
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/loans/${loanId}`;
    const qrCode = await this.qrcodeService.generate(trackingUrl, {
      width: 200,
    });

    return {
      pdf: pdfBuffer,
      qrCode: qrCode.dataUrl,
    };
  }
}

