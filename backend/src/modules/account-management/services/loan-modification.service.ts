import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanModification, ModificationStatus, ModificationType } from '../entities/loan-modification.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { CreateLoanModificationDto, ReviewModificationDto, ExecuteModificationDto } from '../dto/loan-modification.dto';
import { PaymentHolidayTrackingService } from '../../loan-restructure/services/payment-holiday-tracking.service';

/**
 * Service for loan modification requests
 * UC-021: Loan Modification Request
 */
@Injectable()
export class LoanModificationService {
  private readonly logger = new Logger(LoanModificationService.name);

  constructor(
    @InjectRepository(LoanModification)
    private readonly modificationRepository: Repository<LoanModification>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly paymentHolidayTrackingService: PaymentHolidayTrackingService,
  ) {}

  /**
   * Create modification request
   */
  async createModificationRequest(createDto: CreateLoanModificationDto, userId: string): Promise<LoanModification> {
    const loan = await this.loanRepository.findOne({ where: { id: createDto.loanId } });
    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
    }

    // Validate modification type specific fields
    this.validateModificationRequest(createDto);

    // Validate payment holiday limit if requesting payment holiday
    if (createDto.modificationType === ModificationType.PAYMENT_HOLIDAY) {
      await this.paymentHolidayTrackingService.validatePaymentHolidayRequest(createDto.loanId);
    }

    const modification = this.modificationRepository.create({
      ...createDto,
      requestedBy: userId,
      requestedDate: new Date(),
      status: ModificationStatus.PENDING,
    });

    const savedModification = await this.modificationRepository.save(modification);

    this.logger.log(`Modification request created: ${savedModification.id} for loan ${loan.loanNumber}`);

    return savedModification;
  }

  /**
   * Review modification request
   */
  async reviewModification(
    modificationId: string,
    reviewDto: ReviewModificationDto,
    userId: string,
  ): Promise<LoanModification> {
    const modification = await this.modificationRepository.findOne({
      where: { id: modificationId },
      relations: ['loan'],
    });

    if (!modification) {
      throw new NotFoundException(`Modification with ID ${modificationId} not found`);
    }

    if (modification.status !== ModificationStatus.PENDING && modification.status !== ModificationStatus.UNDER_REVIEW) {
      throw new BadRequestException(`Modification is not in PENDING or UNDER_REVIEW status`);
    }

    modification.status = ModificationStatus.UNDER_REVIEW;
    modification.reviewedBy = userId;
    modification.reviewedDate = new Date();
    modification.reviewNotes = reviewDto.reviewNotes;

    if (reviewDto.rejectionReason) {
      modification.status = ModificationStatus.REJECTED;
      modification.rejectionReason = reviewDto.rejectionReason;
    }

    return await this.modificationRepository.save(modification);
  }

  /**
   * Approve modification
   */
  async approveModification(modificationId: string, userId: string): Promise<LoanModification> {
    const modification = await this.modificationRepository.findOne({
      where: { id: modificationId },
      relations: ['loan'],
    });

    if (!modification) {
      throw new NotFoundException(`Modification with ID ${modificationId} not found`);
    }

    if (modification.status !== ModificationStatus.UNDER_REVIEW) {
      throw new BadRequestException(`Modification must be under review to approve`);
    }

    modification.status = ModificationStatus.APPROVED;
    modification.approvedBy = userId;
    modification.approvedDate = new Date();

    return await this.modificationRepository.save(modification);
  }

  /**
   * Execute modification
   */
  async executeModification(
    modificationId: string,
    executeDto: ExecuteModificationDto,
  ): Promise<{ modification: LoanModification; loan: Loan }> {
    const modification = await this.modificationRepository.findOne({
      where: { id: modificationId },
      relations: ['loan'],
    });

    if (!modification) {
      throw new NotFoundException(`Modification with ID ${modificationId} not found`);
    }

    if (modification.status !== ModificationStatus.APPROVED) {
      throw new BadRequestException(`Modification must be approved to execute`);
    }

    const loan = modification.loan;

    // Apply modification to loan
    switch (modification.modificationType) {
      case ModificationType.RATE_REDUCTION:
        if (modification.newInterestRate) {
          loan.rateOfInterest = modification.newInterestRate;
        }
        break;
      case ModificationType.TERM_EXTENSION:
        if (modification.newTermMonths) {
          loan.repaymentPeriods = modification.newTermMonths;
        }
        break;
      case ModificationType.PAYMENT_HOLIDAY:
        // Would implement payment holiday logic
        break;
      case ModificationType.PAYMENT_REDUCTION:
        // Would implement payment reduction logic
        break;
    }

    await this.loanRepository.save(loan);

    modification.status = ModificationStatus.EXECUTED;
    modification.executedDate = new Date();
    modification.modificationAgreement = executeDto.modificationAgreement;

    const savedModification = await this.modificationRepository.save(modification);

    this.logger.log(`Modification executed: ${modificationId} for loan ${loan.loanNumber}`);

    return { modification: savedModification, loan };
  }

  /**
   * Get modifications for loan
   */
  async getModificationsForLoan(loanId: string): Promise<LoanModification[]> {
    return await this.modificationRepository.find({
      where: { loanId },
      order: { requestedDate: 'DESC' },
    });
  }

  /**
   * Validate modification request
   */
  private validateModificationRequest(createDto: CreateLoanModificationDto): void {
    switch (createDto.modificationType) {
      case ModificationType.RATE_REDUCTION:
        if (!createDto.newInterestRate) {
          throw new BadRequestException('New interest rate is required for rate reduction');
        }
        break;
      case ModificationType.TERM_EXTENSION:
        if (!createDto.newTermMonths) {
          throw new BadRequestException('New term in months is required for term extension');
        }
        break;
      case ModificationType.PAYMENT_HOLIDAY:
        if (!createDto.paymentHolidayMonths) {
          throw new BadRequestException('Payment holiday months is required');
        }
        break;
      case ModificationType.PAYMENT_REDUCTION:
        if (!createDto.newPaymentAmount) {
          throw new BadRequestException('New payment amount is required for payment reduction');
        }
        break;
    }
  }
}













