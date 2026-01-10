import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefinancingApplication, RefinancingStatus, RefinancingType } from '../entities/refinancing-application.entity';
import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { LoanApplication, ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { CreateRefinancingApplicationDto, CheckEligibilityDto, OfferRefinancingDto } from '../dto/refinancing.dto';

/**
 * Service for refinancing applications
 * UC-022: Refinancing Application
 */
@Injectable()
export class RefinancingService {
  private readonly logger = new Logger(RefinancingService.name);

  constructor(
    @InjectRepository(RefinancingApplication)
    private readonly refinancingRepository: Repository<RefinancingApplication>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Create refinancing application
   */
  async createApplication(createDto: CreateRefinancingApplicationDto, userId: string): Promise<RefinancingApplication> {
    const loan = await this.loanRepository.findOne({ where: { id: createDto.loanId } });
    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
    }

    // Check if there's already a pending application
    const existing = await this.refinancingRepository.findOne({
      where: { loanId: createDto.loanId, status: RefinancingStatus.PENDING },
    });

    if (existing) {
      throw new BadRequestException('A pending refinancing application already exists for this loan');
    }

    const application = this.refinancingRepository.create({
      ...createDto,
      requestedBy: userId,
      requestedDate: new Date(),
      status: RefinancingStatus.PENDING,
    });

    const savedApplication = await this.refinancingRepository.save(application);

    this.logger.log(`Refinancing application created: ${savedApplication.id} for loan ${loan.loanNumber}`);

    return savedApplication;
  }

  /**
   * Check eligibility
   */
  async checkEligibility(
    applicationId: string,
    eligibilityDto: CheckEligibilityDto,
  ): Promise<RefinancingApplication> {
    const application = await this.refinancingRepository.findOne({
      where: { id: applicationId },
      relations: ['loan'],
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    const loan = application.loan;

    // Eligibility criteria (simplified)
    const loanAge = Math.floor((new Date().getTime() - new Date(loan.postingDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
    const eligible = loanAge >= 6 && (loan.daysPastDue || 0) < 30;

    application.eligibilityChecked = true;
    application.eligible = eligible;
    application.eligibilityNotes = eligibilityDto.notes || (eligible ? 'Eligible for refinancing' : 'Not eligible');
    application.status = eligible ? RefinancingStatus.ELIGIBILITY_CHECKED : RefinancingStatus.REJECTED;

    if (!eligible) {
      application.rejectionReason = 'Loan does not meet eligibility criteria';
    }

    return await this.refinancingRepository.save(application);
  }

  /**
   * Perform credit check
   */
  async performCreditCheck(applicationId: string): Promise<RefinancingApplication> {
    const application = await this.refinancingRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    if (!application.eligible) {
      throw new BadRequestException('Application is not eligible for credit check');
    }

    // In production, would call credit bureau API
    // const creditCheck = await this.creditService.checkCredit(application.loan.applicantId);

    application.creditChecked = true;
    application.creditCheckResult = 'Credit check completed'; // Would contain actual results
    application.status = RefinancingStatus.CREDIT_CHECKED;

    return await this.refinancingRepository.save(application);
  }

  /**
   * Offer refinancing terms
   */
  async offerRefinancing(applicationId: string, offerDto: OfferRefinancingDto): Promise<RefinancingApplication> {
    const application = await this.refinancingRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    if (!application.creditChecked) {
      throw new BadRequestException('Credit check must be completed before offering terms');
    }

    application.offeredRate = offerDto.offeredRate;
    application.offeredAmount = offerDto.offeredAmount;
    application.offeredTerm = offerDto.offeredTerm;
    application.offerExpiryDate = new Date(offerDto.offerExpiryDate);
    application.status = RefinancingStatus.OFFERED;

    const savedApplication = await this.refinancingRepository.save(application);

    // In production, would notify borrower
    // await this.notificationService.sendRefinancingOffer(savedApplication);

    return savedApplication;
  }

  /**
   * Accept offer
   */
  async acceptOffer(applicationId: string): Promise<{ application: RefinancingApplication; newLoanApplication?: LoanApplication }> {
    const application = await this.refinancingRepository.findOne({
      where: { id: applicationId },
      relations: ['loan'],
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    if (application.status !== RefinancingStatus.OFFERED) {
      throw new BadRequestException(`Application is not in OFFERED status`);
    }

    if (application.offerExpiryDate && new Date() > application.offerExpiryDate) {
      throw new BadRequestException('Offer has expired');
    }

    application.status = RefinancingStatus.ACCEPTED;
    application.offerAcceptedDate = new Date();

    // Create new loan application
    const newLoanApplication = this.applicationRepository.create({
      companyId: application.loan.companyId,
      loanProductId: application.loan.loanProductId,
      requestedAmount: application.offeredAmount || application.loan.loanAmount,
      applicantType: application.loan.applicantType,
      applicantId: application.loan.applicantId,
      repaymentPeriods: application.offeredTerm || application.loan.repaymentPeriods,
      status: ApplicationStatus.APPROVED, // Would go through normal approval process
    });

    const savedApplication = await this.applicationRepository.save(newLoanApplication);

    application.newLoanApplicationId = savedApplication.id;
    await this.refinancingRepository.save(application);

    // Close existing loan
    application.existingLoanClosedDate = new Date();
    application.loan.status = LoanStatus.CLOSED;
    await this.loanRepository.save(application.loan);

    application.status = RefinancingStatus.CLOSED;
    await this.refinancingRepository.save(application);

    this.logger.log(`Refinancing offer accepted: ${applicationId}`);

    return { application, newLoanApplication: savedApplication };
  }

  /**
   * Get refinancing applications for loan
   */
  async getApplicationsForLoan(loanId: string): Promise<RefinancingApplication[]> {
    return await this.refinancingRepository.find({
      where: { loanId },
      order: { requestedDate: 'DESC' },
    });
  }
}

