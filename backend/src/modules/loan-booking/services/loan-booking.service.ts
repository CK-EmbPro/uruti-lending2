import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanBooking, BookingStatus } from '../entities/loan-booking.entity';
import { LoanDocument, DocumentType, DocumentStatus } from '../entities/loan-document.entity';
import { LoanSignature, SignatureType, SignatureStatus } from '../entities/loan-signature.entity';
import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { LoanApplication, ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { CreateLoanBookingDto, UpdateLoanBookingDto, CancelLoanBookingDto } from '../dto/loan-booking.dto';
import { CreateLoanDocumentDto } from '../dto/loan-document.dto';
import { CreateLoanSignatureDto, SignDocumentDto, NotarizeDocumentDto } from '../dto/loan-signature.dto';

/**
 * Service for loan approval and booking
 * UC-011: Loan Approval & Booking
 */
@Injectable()
export class LoanBookingService {
  private readonly logger = new Logger(LoanBookingService.name);

  constructor(
    @InjectRepository(LoanBooking)
    private readonly bookingRepository: Repository<LoanBooking>,
    @InjectRepository(LoanDocument)
    private readonly documentRepository: Repository<LoanDocument>,
    @InjectRepository(LoanSignature)
    private readonly signatureRepository: Repository<LoanSignature>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Create loan booking from approved application
   */
  async createBooking(createDto: CreateLoanBookingDto, userId: string): Promise<LoanBooking> {
    const loan = await this.loanRepository.findOne({ where: { id: createDto.loanId } });
    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
    }

    const application = await this.applicationRepository.findOne({ where: { id: createDto.applicationId } });
    if (!application) {
      throw new NotFoundException(`Application with ID ${createDto.applicationId} not found`);
    }

    // Check if loan is in correct status
    if (loan.status !== LoanStatus.SANCTIONED) {
      throw new BadRequestException(
        `Loan must be in SANCTIONED or APPROVED status to create booking. Current status: ${loan.status}`,
      );
    }

    // Check if booking already exists
    const existingBooking = await this.bookingRepository.findOne({
      where: { loanId: loan.id },
    });

    if (existingBooking) {
      throw new BadRequestException('Booking already exists for this loan');
    }

    const booking = this.bookingRepository.create({
      ...createDto,
      bookedBy: userId,
      status: BookingStatus.PENDING,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    this.logger.log(`Loan booking created for loan ${loan.loanNumber} by user ${userId}`);

    return savedBooking;
  }

  /**
   * Generate loan documents
   */
  async generateDocuments(bookingId: string, userId: string): Promise<LoanDocument[]> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['loan', 'application'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    const loan = booking.loan;
    const application = booking.application;

    // Generate standard loan documents
    const documentTypes = [
      DocumentType.LOAN_AGREEMENT,
      DocumentType.PROMISSORY_NOTE,
      DocumentType.DISCLOSURE_STATEMENT,
      DocumentType.TERMS_AND_CONDITIONS,
    ];

    if (loan.isSecuredLoan) {
      documentTypes.push(DocumentType.SECURITY_AGREEMENT);
    }

    const documents: LoanDocument[] = [];

    for (const docType of documentTypes) {
      const document = this.documentRepository.create({
        loanId: loan.id,
        documentType: docType,
        documentName: `${docType} - ${loan.loanNumber}`,
        status: DocumentStatus.GENERATED,
        templateId: `template-${docType.toLowerCase().replace(/\s+/g, '-')}`,
        templateData: {
          loanNumber: loan.loanNumber,
          borrowerName: application.applicantId, // Would fetch actual name
          loanAmount: loan.loanAmount,
          interestRate: loan.rateOfInterest,
          term: loan.repaymentPeriods,
          postingDate: loan.postingDate,
        },
        generatedDate: new Date(),
        generatedBy: userId,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      });

      const savedDocument = await this.documentRepository.save(document);
      documents.push(savedDocument);
    }

    // Update booking status
    booking.status = BookingStatus.DOCUMENTS_GENERATED;
    await this.bookingRepository.save(booking);

    this.logger.log(`Generated ${documents.length} documents for booking ${bookingId}`);

    return documents;
  }

  /**
   * Create signature request for document
   */
  async createSignatureRequest(
    documentId: string,
    createDto: CreateLoanSignatureDto,
  ): Promise<LoanSignature> {
    const document = await this.documentRepository.findOne({ where: { id: documentId } });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    if (document.status !== DocumentStatus.GENERATED && document.status !== DocumentStatus.PENDING_SIGNATURE) {
      throw new BadRequestException(`Document must be in GENERATED or PENDING_SIGNATURE status`);
    }

    const signature = this.signatureRepository.create({
      ...createDto,
      status: SignatureStatus.PENDING,
      expiryDate: createDto.expiryDate ? new Date(createDto.expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    });

    const savedSignature = await this.signatureRepository.save(signature);

    // Update document status
    document.status = DocumentStatus.PENDING_SIGNATURE;
    await this.documentRepository.save(document);

    this.logger.log(`Signature request created for document ${documentId}`);

    // In production, send email/SMS notification to signer
    // await this.notificationService.sendSignatureRequest(savedSignature);

    return savedSignature;
  }

  /**
   * Sign document (e-signature or digital signature)
   */
  async signDocument(signatureId: string, signDto: SignDocumentDto): Promise<LoanSignature> {
    const signature = await this.signatureRepository.findOne({
      where: { id: signatureId },
      relations: ['document'],
    });

    if (!signature) {
      throw new NotFoundException(`Signature with ID ${signatureId} not found`);
    }

    if (signature.status !== SignatureStatus.PENDING) {
      throw new BadRequestException(`Signature is not in PENDING status`);
    }

    if (signature.expiryDate && new Date() > signature.expiryDate) {
      signature.status = SignatureStatus.EXPIRED;
      await this.signatureRepository.save(signature);
      throw new BadRequestException('Signature request has expired');
    }

    signature.status = SignatureStatus.SIGNED;
    signature.signatureData = signDto.signatureData;
    signature.signedDate = new Date();
    signature.ipAddress = signDto.ipAddress;
    signature.userAgent = signDto.userAgent;

    const savedSignature = await this.signatureRepository.save(signature);

    // Update document status
    const document = signature.document;
    document.status = DocumentStatus.SIGNED;
    await this.documentRepository.save(document);

    // Check if all signatures are complete
    await this.checkSignaturesComplete(document.loanId);

    this.logger.log(`Document signed: ${signatureId}`);

    return savedSignature;
  }

  /**
   * Notarize document
   */
  async notarizeDocument(signatureId: string, notarizeDto: NotarizeDocumentDto): Promise<LoanSignature> {
    const signature = await this.signatureRepository.findOne({
      where: { id: signatureId },
      relations: ['document'],
    });

    if (!signature) {
      throw new NotFoundException(`Signature with ID ${signatureId} not found`);
    }

    if (signature.signatureType !== SignatureType.NOTARIZED && signature.signatureType !== SignatureType.WET_SIGNATURE) {
      throw new BadRequestException('Only notarized or wet signatures can be notarized');
    }

    signature.notaryName = notarizeDto.notaryName;
    signature.notaryLicenseNumber = notarizeDto.notaryLicenseNumber;
    signature.notarizedDate = notarizeDto.notarizedDate ? new Date(notarizeDto.notarizedDate) : new Date();
    signature.remarks = notarizeDto.remarks;

    const savedSignature = await this.signatureRepository.save(signature);

    // Update document status
    const document = signature.document;
    document.status = DocumentStatus.NOTARIZED;
    await this.documentRepository.save(document);

    this.logger.log(`Document notarized: ${signatureId}`);

    return savedSignature;
  }

  /**
   * Check if all signatures are complete and update booking status
   */
  private async checkSignaturesComplete(loanId: string): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { loanId },
      relations: ['documents'],
    });

    if (!booking) {
      return;
    }

    const documents = await this.documentRepository.find({
      where: { loanId },
      relations: ['signatures'],
    });

    const allSigned = documents.every((doc) => {
      if (doc.status === DocumentStatus.COMPLETED || doc.status === DocumentStatus.NOTARIZED) {
        return true;
      }
      if (doc.status === DocumentStatus.SIGNED) {
        const signatures = doc.signatures || [];
        return signatures.some((sig) => sig.status === SignatureStatus.SIGNED);
      }
      return false;
    });

    if (allSigned) {
      booking.status = BookingStatus.SIGNATURES_COMPLETE;
      await this.bookingRepository.save(booking);
    }
  }

  /**
   * Complete loan booking (create account and finalize)
   */
  async completeBooking(bookingId: string, userId: string): Promise<{ booking: LoanBooking; accountNumber: string }> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['loan', 'application', 'documents'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (booking.status !== BookingStatus.SIGNATURES_COMPLETE) {
      throw new BadRequestException(
        `Booking must have all signatures complete. Current status: ${booking.status}`,
      );
    }

    // Verify all required documents are signed
    const documents = await this.documentRepository.find({
      where: { loanId: booking.loanId },
      relations: ['signatures'],
    });

    const allRequiredSigned = documents.every((doc) => {
      const signatures = doc.signatures || [];
      return signatures.some((sig) => sig.status === SignatureStatus.SIGNED);
    });

    if (!allRequiredSigned) {
      throw new BadRequestException('Not all required documents are signed');
    }

    // Create loan account (mocked - in production, integrate with accounting system)
    const accountNumber = await this.createLoanAccount(booking.loan);

    // Update booking
    booking.status = BookingStatus.BOOKED;
    booking.bookedDate = new Date();
    booking.accountCreated = true;
    booking.accountNumber = accountNumber;
    booking.accountDetails = {
      accountType: 'Loan Account',
      createdDate: new Date().toISOString(),
      createdBy: userId,
    };

    const savedBooking = await this.bookingRepository.save(booking);

    // Update loan status
    const loan = booking.loan;
    loan.status = LoanStatus.SANCTIONED; // Or ACTIVE depending on business rules
    await this.loanRepository.save(loan);

    this.logger.log(`Loan booking completed for loan ${loan.loanNumber}. Account: ${accountNumber}`);

    return { booking: savedBooking, accountNumber };
  }

  /**
   * Create loan account (mocked - integrate with accounting system)
   */
  private async createLoanAccount(loan: Loan): Promise<string> {
    // In production, this would integrate with the accounting module
    // to create a loan account
    const accountNumber = `LA-${loan.loanNumber}-${Date.now().toString().slice(-6)}`;
    return accountNumber;
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<LoanBooking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['loan', 'application', 'documents'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    return booking;
  }

  /**
   * Get booking for loan
   */
  async getBookingForLoan(loanId: string): Promise<LoanBooking | null> {
    return await this.bookingRepository.findOne({
      where: { loanId },
      relations: ['loan', 'application', 'documents'],
    });
  }

  /**
   * Update booking
   */
  async updateBooking(bookingId: string, updateDto: UpdateLoanBookingDto): Promise<LoanBooking> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    Object.assign(booking, updateDto);
    return await this.bookingRepository.save(booking);
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, cancelDto: CancelLoanBookingDto, userId: string): Promise<LoanBooking> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (booking.status === BookingStatus.BOOKED) {
      throw new BadRequestException('Cannot cancel a booked loan');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = cancelDto.cancellationReason;
    booking.cancelledBy = userId;
    booking.cancelledDate = new Date();

    return await this.bookingRepository.save(booking);
  }
}

