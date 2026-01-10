import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplication } from '../entities/loan-application.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { EmailService } from '../../email/email.service';
import { FileUploadService } from '../../file-upload/file-upload.service';
import { QRCodeService } from '../../qrcode/qrcode.service';
import { PDFService } from '../../pdf/pdf.service';

/**
 * Service to integrate new platform services with loan applications
 * Demonstrates practical usage of email, file upload, QR codes, and PDF services
 */
@Injectable()
export class LoanApplicationIntegrationService {
  private readonly logger = new Logger(LoanApplicationIntegrationService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    private readonly emailService: EmailService,
    private readonly fileUploadService: FileUploadService,
    private readonly qrcodeService: QRCodeService,
    private readonly pdfService: PDFService,
  ) {}

  /**
   * Send application confirmation email with QR code
   */
  async sendApplicationConfirmation(applicationId: string): Promise<void> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    // Fetch loan product
    const loanProduct = await this.loanProductRepository.findOne({
      where: { id: application.loanProductId },
    });

    // Generate QR code for application tracking
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/loan-applications/${applicationId}`;
    const qrCode = await this.qrcodeService.generate(trackingUrl, {
      width: 200,
    });

    // Send confirmation email
    await this.emailService.sendEmail({
      to: '', // Applicant email not stored in LoanApplication entity
      subject: `Loan Application Confirmation - ${application.applicationNumber}`,
      template: 'application-status',
      context: {
        applicationNumber: application.applicationNumber,
        applicantName: 'Applicant', // Applicant name not stored in LoanApplication entity
        loanProductName: loanProduct?.productName || 'Loan Product',
        requestedAmount: application.requestedAmount,
        status: application.status,
        applicationDate: application.applicationDate,
        trackingUrl,
        qrCode: qrCode.dataUrl, // Include QR code in email
      },
    });

    this.logger.log(`Confirmation email sent for application ${application.applicationNumber}`);
  }

  /**
   * Process and attach documents to loan application
   */
  async attachDocumentToApplication(
    applicationId: string,
    file: Express.Multer.File,
  ): Promise<{ success: boolean; fileUrl: string }> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    // Upload file
    const uploadedFile = await this.fileUploadService.uploadFile(file);

    // Store file reference in application (you may want to add a documents relation)
    // For now, we'll log it
    this.logger.log(
      `Document attached to application ${application.applicationNumber}: ${uploadedFile.filename}`,
    );

    return {
      success: true,
      fileUrl: uploadedFile.path,
    };
  }

  /**
   * Generate and email loan application PDF
   */
  async generateAndEmailApplicationPDF(applicationId: string): Promise<void> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    // Fetch loan product
    const loanProduct = await this.loanProductRepository.findOne({
      where: { id: application.loanProductId },
    });

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateLoanAgreement({
      loanId: application.id,
      customerName: 'Applicant', // Applicant name not stored in LoanApplication entity
      amount: application.requestedAmount,
      interestRate: loanProduct?.rateOfInterest || 0,
      term: application.repaymentPeriods || 12,
      terms: [
        `Loan Application Number: ${application.applicationNumber}`,
        `Loan Product: ${loanProduct?.productName || 'Loan Product'}`,
        `Application Date: ${application.applicationDate}`,
        'This is a preliminary loan agreement based on your application.',
        'Final terms will be confirmed upon approval.',
      ],
    });

    // Generate QR code for PDF
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/loan-applications/${applicationId}`;
    const qrCode = await this.qrcodeService.generate(trackingUrl, {
      width: 150,
    });

    // Send email with PDF attachment
    await this.emailService.sendEmail({
      to: '', // Applicant email not stored in LoanApplication entity
      subject: `Loan Application PDF - ${application.applicationNumber}`,
      html: `
        <h2>Your Loan Application</h2>
        <p>Please find attached your loan application document.</p>
        <p>Application Number: <strong>${application.applicationNumber}</strong></p>
        <p>You can track your application using the QR code below:</p>
        <img src="${qrCode.dataUrl}" alt="Application QR Code" />
        <p><a href="${trackingUrl}">View Application Online</a></p>
      `,
      attachments: [
        {
          filename: `loan-application-${application.applicationNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    this.logger.log(`Application PDF sent for ${application.applicationNumber}`);
  }

  /**
   * Send application status update email
   */
  async sendStatusUpdateEmail(applicationId: string, newStatus: string): Promise<void> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    // Fetch loan product
    const loanProduct = await this.loanProductRepository.findOne({
      where: { id: application.loanProductId },
    });

    await this.emailService.sendEmail({
      to: '', // Applicant email not stored in LoanApplication entity
      subject: `Loan Application Status Update - ${application.applicationNumber}`,
      template: 'application-status',
      context: {
        applicationNumber: application.applicationNumber,
        applicantName: 'Applicant', // Applicant name not stored in LoanApplication entity
        loanProductName: loanProduct?.productName || 'Loan Product',
        requestedAmount: application.requestedAmount,
        status: newStatus,
        previousStatus: application.status,
        applicationDate: application.applicationDate,
        trackingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/loan-applications/${applicationId}`,
      },
    });

    this.logger.log(`Status update email sent for application ${application.applicationNumber}`);
  }

  /**
   * Generate application summary with QR code for download
   */
  async generateApplicationSummary(applicationId: string): Promise<{
    pdf: Buffer;
    qrCode: string;
  }> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    // Fetch loan product
    const loanProduct = await this.loanProductRepository.findOne({
      where: { id: application.loanProductId },
    });

    // Generate PDF summary
    const pdfBuffer = await this.pdfService.generateLoanAgreement({
      loanId: application.id,
      customerName: 'Applicant', // Applicant name not stored in LoanApplication entity
      amount: application.requestedAmount,
      interestRate: loanProduct?.rateOfInterest || 0,
      term: application.repaymentPeriods || 12,
      terms: [
        `Loan Application Number: ${application.applicationNumber}`,
        `Loan Product: ${loanProduct?.productName || 'Loan Product'}`,
        `Application Date: ${application.applicationDate}`,
        'This is a summary of your loan application.',
      ],
    });

    // Generate QR code
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/loan-applications/${applicationId}`;
    const qrCode = await this.qrcodeService.generate(trackingUrl, {
      width: 200,
    });

    return {
      pdf: pdfBuffer,
      qrCode: qrCode.dataUrl,
    };
  }
}

