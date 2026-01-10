import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { PrefillApplicationDto, PrefillResultDto } from '../dto/prefill-application.dto';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class ApplicationPrefillService {
  private readonly logger = new Logger(ApplicationPrefillService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
  ) {}

  /**
   * Pre-fill loan application based on applicant history and data
   */
  async prefillApplication(
    dto: PrefillApplicationDto,
    companyId: string,
  ): Promise<PrefillResultDto> {
    this.logger.log(`Pre-filling application for applicant ${dto.applicantId}`);

    const applicationData: any = {
      applicantId: dto.applicantId,
      applicantType: dto.applicantType,
      companyId,
    };

    const filledFields: string[] = ['applicantId', 'applicantType', 'companyId'];
    const suggestions: string[] = [];
    let confidenceScore = 0.5; // Base confidence
    let dataSource = 'New Applicant';

    // 1. Get previous applications
    const previousApplications = await this.applicationRepository.find({
      where: {
        applicantId: dto.applicantId,
        applicantType: dto.applicantType,
        companyId,
      },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // 2. Get previous loans
    const previousLoans = await this.loanRepository.find({
      where: {
        applicantId: dto.applicantId,
        applicantType: dto.applicantType,
        companyId,
      },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // 3. Pre-fill from most recent approved application
    if (previousApplications.length > 0) {
      const recentApp = previousApplications[0];
      dataSource = 'Previous Application';

      if (recentApp.loanProductId && !dto.loanProductId) {
        applicationData.loanProductId = recentApp.loanProductId;
        filledFields.push('loanProductId');
        confidenceScore += 0.2;
      }

      if (recentApp.requestedAmount) {
        // Suggest similar amount (or slightly higher if previous was approved)
        if (recentApp.status === 'Approved') {
          applicationData.requestedAmount = recentApp.approvedAmount || recentApp.requestedAmount;
          suggestions.push(
            `Based on your previous approved application, we suggest ${applicationData.requestedAmount}`,
          );
        } else {
          applicationData.requestedAmount = recentApp.requestedAmount;
        }
        filledFields.push('requestedAmount');
        confidenceScore += 0.15;
      }

      if (recentApp.remarks) {
        applicationData.remarks = recentApp.remarks;
        filledFields.push('remarks');
        confidenceScore += 0.1;
      }

      if (recentApp.repaymentPeriods) {
        applicationData.repaymentPeriods = recentApp.repaymentPeriods;
        filledFields.push('repaymentPeriods');
      }

      if (recentApp.repaymentFrequency) {
        applicationData.repaymentFrequency = recentApp.repaymentFrequency;
        filledFields.push('repaymentFrequency');
      }

      if (recentApp.repaymentMethod) {
        applicationData.repaymentMethod = recentApp.repaymentMethod;
        filledFields.push('repaymentMethod');
      }

      if (recentApp.isSecuredLoan !== undefined) {
        applicationData.isSecuredLoan = recentApp.isSecuredLoan;
        filledFields.push('isSecuredLoan');
      }
    }

    // 4. Pre-fill from active loans (if any)
    const activeLoans = previousLoans.filter((loan) => loan.status === LoanStatus.ACTIVE);
    if (activeLoans.length > 0) {
      const activeLoan = activeLoans[0];
      dataSource = 'Active Loan';

      if (!applicationData.loanProductId && activeLoan.loanProductId) {
        applicationData.loanProductId = activeLoan.loanProductId;
        filledFields.push('loanProductId');
        confidenceScore += 0.15;
      }

      // Suggest amount based on active loan performance
      if (activeLoan.loanAmount && !applicationData.requestedAmount) {
        // If customer has good payment history, suggest higher amount
        const paymentHistory = this.analyzePaymentHistory(activeLoan);
        if (paymentHistory.isGood) {
          applicationData.requestedAmount = activeLoan.loanAmount * 1.2; // 20% increase
          suggestions.push(
            `Based on your excellent payment history, you may qualify for up to ${applicationData.requestedAmount}`,
          );
        } else {
          applicationData.requestedAmount = activeLoan.loanAmount;
        }
        filledFields.push('requestedAmount');
        confidenceScore += 0.1;
      }

      if (activeLoan.repaymentFrequency && !applicationData.repaymentFrequency) {
        applicationData.repaymentFrequency = activeLoan.repaymentFrequency;
        filledFields.push('repaymentFrequency');
      }

      if (activeLoan.repaymentMethod && !applicationData.repaymentMethod) {
        applicationData.repaymentMethod = activeLoan.repaymentMethod;
        filledFields.push('repaymentMethod');
      }
    }

    // 5. Pre-fill loan product if specified
    if (dto.loanProductId) {
      const product = await this.loanProductRepository.findOne({
        where: { id: dto.loanProductId, companyId },
      });

      if (product) {
        applicationData.loanProductId = dto.loanProductId;
        filledFields.push('loanProductId');
        confidenceScore += 0.1;

        // Suggest amount based on product limits
        if (product.maximumLoanAmount && !applicationData.requestedAmount) {
          applicationData.requestedAmount = product.maximumLoanAmount * 0.8; // 80% of max
          suggestions.push(
            `Based on the selected product, maximum loan amount is ${product.maximumLoanAmount}`,
          );
        }
      }
    }

    // 6. Analyze application patterns
    if (previousApplications.length > 1) {
      const pattern = this.analyzeApplicationPattern(previousApplications);
      if (pattern.preferredProduct) {
        if (!applicationData.loanProductId) {
          applicationData.loanProductId = pattern.preferredProduct;
          filledFields.push('loanProductId');
          suggestions.push('You frequently apply for this product');
        }
      }

      if (pattern.averageAmount && !applicationData.requestedAmount) {
        applicationData.requestedAmount = pattern.averageAmount;
        filledFields.push('requestedAmount');
        suggestions.push('Based on your application history');
      }
    }

    // 7. Pre-fill contact information if provided
    if (dto.email) {
      applicationData.applicantEmailAddress = dto.email;
      filledFields.push('applicantEmailAddress');
    }

    if (dto.phoneNumber) {
      applicationData.applicantPhoneNumber = dto.phoneNumber;
      filledFields.push('applicantPhoneNumber');
    }

    // Clamp confidence score
    confidenceScore = Math.min(1, Math.max(0, confidenceScore));

    // Add general suggestions
    if (previousApplications.length === 0 && previousLoans.length === 0) {
      suggestions.push('This appears to be your first application. Consider starting with a smaller amount.');
    }

    if (activeLoans.length > 0) {
      suggestions.push(
        `You have ${activeLoans.length} active loan(s). Consider your total debt obligations.`,
      );
    }

    return {
      applicationData,
      filledFields: [...new Set(filledFields)], // Remove duplicates
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      dataSource,
      suggestions,
    };
  }

  /**
   * Analyze payment history for a loan
   */
  private analyzePaymentHistory(loan: Loan): { isGood: boolean; onTimeRate: number } {
    // This is a simplified analysis
    // In production, you'd query repayment records
    const totalPaid = loan.totalAmountPaid || 0;
    const expectedPaid = loan.loanAmount * 0.5; // Assume 50% paid if active

    // If loan is active and payments are being made, consider it good
    const isGood = loan.status === LoanStatus.ACTIVE && totalPaid > 0;

    return {
      isGood,
      onTimeRate: isGood ? 0.9 : 0.5, // Simplified
    };
  }

  /**
   * Analyze application patterns
   */
  private analyzeApplicationPattern(
    applications: LoanApplication[],
  ): { preferredProduct?: string; averageAmount?: number } {
    // Find most frequently used product
    const productCounts: Record<string, number> = {};
    let totalAmount = 0;
    let amountCount = 0;

    for (const app of applications) {
      if (app.loanProductId) {
        productCounts[app.loanProductId] = (productCounts[app.loanProductId] || 0) + 1;
      }

      if (app.requestedAmount) {
        totalAmount += app.requestedAmount;
        amountCount++;
      }
    }

    // Find most common product
    let preferredProduct: string | undefined;
    let maxCount = 0;
    for (const [productId, count] of Object.entries(productCounts)) {
      if (count > maxCount) {
        maxCount = count;
        preferredProduct = productId;
      }
    }

    return {
      preferredProduct,
      averageAmount: amountCount > 0 ? totalAmount / amountCount : undefined,
    };
  }
}

