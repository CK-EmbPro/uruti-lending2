import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionNotice } from '../entities/collection-notice.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { CollectionNoticeType } from '../../../common/enums/collection-notice-type.enum';
import { EmailService } from '../../email/email.service';
import { QRCodeService } from '../../qrcode/qrcode.service';
import { PDFService } from '../../pdf/pdf.service';
import { ExcelService } from '../../excel/excel.service';

/**
 * Service to integrate new platform services with collections workflows
 * Enhances collection notices with email, PDF, QR codes, and Excel exports
 */
@Injectable()
export class CollectionsIntegrationService {
  private readonly logger = new Logger(CollectionsIntegrationService.name);

  constructor(
    @InjectRepository(CollectionNotice)
    private readonly noticeRepository: Repository<CollectionNotice>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly emailService: EmailService,
    private readonly qrcodeService: QRCodeService,
    private readonly pdfService: PDFService,
    private readonly excelService: ExcelService,
  ) {}

  /**
   * Send collection notice with PDF and QR code
   */
  async sendCollectionNoticeWithPDF(
    noticeId: string,
    loanId: string,
    noticeType: CollectionNoticeType,
    daysPastDue: number,
    amountDue: number,
  ): Promise<void> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    // Generate collection notice PDF
    const noticePdf = await this.pdfService.generatePDF((doc) => {
      doc.fontSize(20).text('Collection Notice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Notice Type: ${noticeType}`);
      doc.text(`Loan Number: ${loan.loanNumber}`);
      doc.text(`Days Past Due: ${daysPastDue}`);
      doc.moveDown();
      doc.text('Payment Details:', { underline: true });
      doc.text(`Amount Due: $${amountDue.toLocaleString()}`);
      // Calculate outstanding balance: loanAmount - totalAmountPaid
      const outstandingBalance = (loan.loanAmount || 0) - (loan.totalAmountPaid || 0);
      doc.text(`Outstanding Balance: $${outstandingBalance.toLocaleString()}`);
      doc.moveDown();
      doc.text('Please contact us immediately to resolve this matter.');
      doc.text('You can make a payment using the QR code below.');
    });

    // Generate payment QR code
    const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/${loanId}?amount=${amountDue}`;
    const qrCode = await this.qrcodeService.generate(paymentUrl, {
      width: 200,
    });

    // Get customer email (Note: applicantEmail not on Loan entity, would need to fetch from Applicant relation)
    const customerEmail = (loan as any).applicantEmail || '';

    if (customerEmail) {
      const subject = this.getNoticeSubject(noticeType, daysPastDue);
      
      await this.emailService.sendEmail({
        to: customerEmail,
        subject,
        html: `
          <h2>Collection Notice</h2>
          <p><strong>Notice Type:</strong> ${noticeType}</p>
          <p><strong>Loan Number:</strong> ${loan.loanNumber}</p>
          <p><strong>Days Past Due:</strong> ${daysPastDue}</p>
          <p><strong>Amount Due:</strong> $${amountDue.toLocaleString()}</p>
          <p><strong>Outstanding Balance:</strong> $${((loan.loanAmount || 0) - (loan.totalAmountPaid || 0)).toLocaleString()}</p>
          <p>Please contact us immediately to resolve this matter.</p>
          <p>You can make a payment using the QR code below:</p>
          <img src="${qrCode.dataUrl}" alt="Payment QR Code" />
          <p><a href="${paymentUrl}">Make Payment Online</a></p>
        `,
        attachments: [
          {
            filename: `collection-notice-${noticeType}-${loan.loanNumber}.pdf`,
            content: noticePdf,
          },
        ],
      });

      this.logger.log(`Collection notice sent with PDF for notice ${noticeId}`);
    }
  }

  /**
   * Export collection data to Excel
   */
  async exportCollectionData(filters?: {
    loanId?: string;
    noticeType?: CollectionNoticeType;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<Buffer> {
    const query = this.noticeRepository.createQueryBuilder('notice')
      .leftJoinAndSelect('notice.loan', 'loan');

    if (filters?.loanId) {
      query.where('notice.loanId = :loanId', { loanId: filters.loanId });
    }

    if (filters?.noticeType) {
      query.andWhere('notice.noticeType = :noticeType', { noticeType: filters.noticeType });
    }

    if (filters?.fromDate) {
      query.andWhere('notice.sentDate >= :fromDate', { fromDate: filters.fromDate });
    }

    if (filters?.toDate) {
      query.andWhere('notice.sentDate <= :toDate', { toDate: filters.toDate });
    }

    const notices = await query.getMany();

    const data = notices.map((notice) => {
      // Calculate amount due from loan if available, otherwise use outstandingBalance from notice
      const loan = notice.loan;
      const amountDue = loan ? ((loan.loanAmount || 0) - (loan.totalAmountPaid || 0)) : (notice.outstandingBalance || 0);
      return {
        'Notice ID': notice.id,
        'Loan Number': loan?.loanNumber || '',
        'Notice Type': notice.noticeType,
        'Days Past Due': notice.daysPastDue || 0,
        'Amount Due': amountDue,
        'Sent Date': notice.sentDate ? notice.sentDate.toISOString() : '',
        'Channel': notice.channel || '',
        'Status': notice.sent ? 'Sent' : 'Pending', // Note: status not on entity, using sent boolean
      };
    });

    const excelBuffer = await this.excelService.generateExcel(data, {
      filename: 'collection-notices',
      sheetName: 'Collection Notices',
    });

    return excelBuffer;
  }

  /**
   * Generate payment arrangement PDF
   */
  async generatePaymentArrangementPDF(
    loanId: string,
    arrangementDetails: {
      totalAmount: number;
      monthlyPayment: number;
      numberOfPayments: number;
      startDate: Date;
      endDate: Date;
    },
  ): Promise<{ pdf: Buffer; qrCode: string }> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    // Generate PDF
    const pdfBuffer = await this.pdfService.generatePDF((doc) => {
      doc.fontSize(20).text('Payment Arrangement Agreement', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Loan Number: ${loan.loanNumber}`);
      // Note: applicantName not on Loan entity, would need to fetch from Applicant relation
      doc.text(`Customer: ${(loan as any).applicantName || 'Customer'}`);
      doc.moveDown();
      doc.text('Arrangement Details:', { underline: true });
      doc.text(`Total Amount: $${arrangementDetails.totalAmount.toLocaleString()}`);
      doc.text(`Monthly Payment: $${arrangementDetails.monthlyPayment.toLocaleString()}`);
      doc.text(`Number of Payments: ${arrangementDetails.numberOfPayments}`);
      doc.text(`Start Date: ${arrangementDetails.startDate.toLocaleDateString()}`);
      doc.text(`End Date: ${arrangementDetails.endDate.toLocaleDateString()}`);
      doc.moveDown();
      doc.text('Terms and Conditions:');
      doc.text('1. Payments must be made on time each month.');
      doc.text('2. Failure to make payments may result in collection action.');
      doc.text('3. This arrangement does not waive any fees or penalties.');
    });

    // Generate QR code for tracking
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/loans/${loanId}/arrangements`;
    const qrCode = await this.qrcodeService.generate(trackingUrl, {
      width: 200,
    });

    return {
      pdf: pdfBuffer,
      qrCode: qrCode.dataUrl,
    };
  }

  /**
   * Get notice subject based on type
   */
  private getNoticeSubject(noticeType: CollectionNoticeType, daysPastDue: number): string {
    switch (noticeType) {
      case CollectionNoticeType.FIRST_NOTICE:
        return `First Collection Notice - ${daysPastDue} Days Past Due`;
      case CollectionNoticeType.SECOND_NOTICE:
        return `Second Collection Notice - ${daysPastDue} Days Past Due`;
      case CollectionNoticeType.FINAL_NOTICE:
        return `Final Collection Notice - ${daysPastDue} Days Past Due - Urgent Action Required`;
      case CollectionNoticeType.PRE_LEGAL_NOTICE:
        return `Pre-Legal Notice - Immediate Attention Required`;
      default:
        return `Collection Notice - ${daysPastDue} Days Past Due`;
    }
  }
}

