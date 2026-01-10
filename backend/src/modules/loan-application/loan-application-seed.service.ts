import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplication, ApplicationStatus } from './entities/loan-application.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { Company } from '../company/entities/company.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanDisbursement } from '../loan-disbursement/entities/loan-disbursement.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { RepaymentScheduleType } from '../../common/enums/repayment-schedule-type.enum';
import { RepaymentFrequency } from '../../common/enums/repayment-frequency.enum';
import { ApplicantType } from '../../common/enums/applicant-type.enum';
import { LoanApplicationService } from './loan-application.service';

@Injectable()
export class LoanApplicationSeedService {
  private readonly logger = new Logger(LoanApplicationSeedService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly loanApplicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanDisbursement)
    private readonly loanDisbursementRepository: Repository<LoanDisbursement>,
    @InjectRepository(LoanRepayment)
    private readonly loanRepaymentRepository: Repository<LoanRepayment>,
    @Inject(forwardRef(() => LoanApplicationService))
    private readonly loanApplicationService: LoanApplicationService,
  ) {}

  /**
   * Seed loan applications and related data
   */
  async seedLoanApplications(): Promise<void> {
    this.logger.log('Starting loan application seed...');

    try {
      // Check if data already exists
      const existingApplications = await this.loanApplicationRepository.count();
      if (existingApplications > 0) {
        this.logger.log(
          `Found ${existingApplications} existing loan applications. Skipping seed.`,
        );
        return;
      }

      // Ensure we have a company
      let company = await this.companyRepository.findOne({
        where: { code: 'URUTI' },
      });

      if (!company) {
        company = this.companyRepository.create({
          name: 'Uruti Lending Company',
          code: 'URUTI',
          email: 'info@urutilending.com',
          address: '123 Financial Street, Business District',
          phone: '+1-555-0123',
          isActive: true,
        });
        company = await this.companyRepository.save(company);
        this.logger.log(`Created company: ${company.name}`);
      }

      // Ensure we have loan products
      const loanProducts = await this.ensureLoanProducts(company.id);

      // Create customers/applicants (using mock IDs - in production these would be real customer entities)
      const customers = [
        { id: 'customer-001', name: 'John Doe', email: 'john.doe@example.com' },
        { id: 'customer-002', name: 'Jane Smith', email: 'jane.smith@example.com' },
        { id: 'customer-003', name: 'Robert Johnson', email: 'robert.j@example.com' },
        { id: 'customer-004', name: 'Emily Davis', email: 'emily.davis@example.com' },
        { id: 'customer-005', name: 'Michael Brown', email: 'michael.b@example.com' },
        { id: 'customer-006', name: 'Sarah Wilson', email: 'sarah.w@example.com' },
        { id: 'customer-007', name: 'David Miller', email: 'david.m@example.com' },
        { id: 'customer-008', name: 'Lisa Anderson', email: 'lisa.a@example.com' },
      ];

      // Generate application numbers
      let applicationCounter = 1;
      const generateApplicationNumber = () => {
        const year = new Date().getFullYear();
        const number = applicationCounter.toString().padStart(5, '0');
        applicationCounter++;
        return `LOAP-${year}-${number}`;
      };

      // Create loan applications with various statuses
      const applications = [
        // Approved applications (will create loans)
        {
          applicationNumber: generateApplicationNumber(),
          companyId: company.id,
          applicantType: 'Customer',
          applicantId: customers[0].id,
          loanProductId: loanProducts[0].id,
          requestedAmount: 50000,
          approvedAmount: 50000,
          status: ApplicationStatus.APPROVED,
          applicationDate: new Date('2024-01-15'),
          approvalDate: new Date('2024-01-20'),
          approvedBy: 'approver-001',
          isSecuredLoan: false,
          repaymentPeriods: 24,
          repaymentFrequency: RepaymentFrequency.MONTHLY,
          repaymentStartDate: new Date('2024-02-01'),
          repaymentMethod: 'Repay Over Periods',
          remarks: 'Application approved for personal loan',
        },
        {
          applicationNumber: generateApplicationNumber(),
          companyId: company.id,
          applicantType: 'Customer',
          applicantId: customers[1].id,
          loanProductId: loanProducts[1].id,
          requestedAmount: 100000,
          approvedAmount: 95000,
          status: ApplicationStatus.APPROVED,
          applicationDate: new Date('2024-02-10'),
          approvalDate: new Date('2024-02-15'),
          approvedBy: 'approver-001',
          isSecuredLoan: true,
          repaymentPeriods: 36,
          repaymentFrequency: 'Monthly',
          repaymentStartDate: new Date('2024-03-01'),
          repaymentMethod: 'Repay Over Periods',
          maximumLoanAmount: 100000,
          remarks: 'Secured loan approved with collateral',
        },
        {
          applicationNumber: generateApplicationNumber(),
          companyId: company.id,
          applicantType: 'Customer',
          applicantId: customers[2].id,
          loanProductId: loanProducts[0].id,
          requestedAmount: 75000,
          approvedAmount: 75000,
          status: ApplicationStatus.APPROVED,
          applicationDate: new Date('2024-03-05'),
          approvalDate: new Date('2024-03-10'),
          approvedBy: 'approver-002',
          isSecuredLoan: false,
          repaymentPeriods: 18,
          repaymentFrequency: 'Monthly',
          repaymentStartDate: new Date('2024-04-01'),
          repaymentMethod: 'Repay Over Periods',
          remarks: 'Auto loan approved',
        },

        // Under Review applications
        {
          applicationNumber: generateApplicationNumber(),
          companyId: company.id,
          applicantType: 'Customer',
          applicantId: customers[3].id,
          loanProductId: loanProducts[1].id,
          requestedAmount: 120000,
          approvedAmount: null,
          status: ApplicationStatus.UNDER_REVIEW,
          applicationDate: new Date('2024-04-01'),
          approvalDate: null,
          isSecuredLoan: true,
          repaymentPeriods: 48,
          repaymentFrequency: 'Monthly',
          repaymentStartDate: new Date('2024-05-01'),
          repaymentMethod: 'Repay Over Periods',
          maximumLoanAmount: 120000,
          remarks: 'Application under review - verifying collateral',
        },
        {
          applicationNumber: generateApplicationNumber(),
          companyId: company.id,
          applicantType: 'Customer',
          applicantId: customers[4].id,
          loanProductId: loanProducts[0].id,
          requestedAmount: 60000,
          approvedAmount: null,
          status: ApplicationStatus.UNDER_REVIEW,
          applicationDate: new Date('2024-04-10'),
          approvalDate: null,
          isSecuredLoan: false,
          repaymentPeriods: 24,
          repaymentFrequency: 'Monthly',
          repaymentStartDate: new Date('2024-05-15'),
          repaymentMethod: 'Repay Over Periods',
          remarks: 'Credit check in progress',
        },

        // Submitted applications
        {
          applicationNumber: generateApplicationNumber(),
          companyId: company.id,
          applicantType: 'Customer',
          applicantId: customers[5].id,
          loanProductId: loanProducts[0].id,
          requestedAmount: 45000,
          approvedAmount: null,
          status: ApplicationStatus.SUBMITTED,
          applicationDate: new Date('2024-04-15'),
          approvalDate: null,
          isSecuredLoan: false,
          repaymentPeriods: 12,
          repaymentFrequency: 'Monthly',
          repaymentStartDate: new Date('2024-05-20'),
          repaymentMethod: 'Repay Over Periods',
          remarks: 'Application submitted, awaiting review',
        },
        {
          applicationNumber: generateApplicationNumber(),
          companyId: company.id,
          applicantType: 'Customer',
          applicantId: customers[6].id,
          loanProductId: loanProducts[1].id,
          requestedAmount: 150000,
          approvedAmount: null,
          status: ApplicationStatus.SUBMITTED,
          applicationDate: new Date('2024-04-20'),
          approvalDate: null,
          isSecuredLoan: true,
          repaymentPeriods: 60,
          repaymentFrequency: 'Monthly',
          repaymentStartDate: new Date('2024-06-01'),
          repaymentMethod: 'Repay Over Periods',
          maximumLoanAmount: 150000,
          remarks: 'Large secured loan application submitted',
        },

        // Rejected applications
        {
          applicationNumber: generateApplicationNumber(),
          companyId: company.id,
          applicantType: 'Customer',
          applicantId: customers[7].id,
          loanProductId: loanProducts[0].id,
          requestedAmount: 200000,
          approvedAmount: null,
          status: ApplicationStatus.REJECTED,
          applicationDate: new Date('2024-03-20'),
          rejectionDate: new Date('2024-03-25'),
          rejectedBy: 'approver-001',
          isSecuredLoan: false,
          repaymentPeriods: 36,
          repaymentFrequency: 'Monthly',
          repaymentStartDate: new Date('2024-04-15'),
          repaymentMethod: 'Repay Over Periods',
          remarks: 'Application rejected - insufficient credit score',
        },
      ];

      // Save applications
      const savedApplications = [];
      for (const appData of applications) {
        const application = this.loanApplicationRepository.create(appData);
        const saved = await this.loanApplicationRepository.save(application);
        savedApplications.push(saved);
        this.logger.log(`Created loan application: ${saved.applicationNumber}`);
      }

      // Create loans from approved applications
      await this.createLoansFromApprovedApplications(savedApplications, company.id);

      this.logger.log('Loan applications seeded successfully');
    } catch (error) {
      this.logger.error(
        `Error seeding loan applications: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Ensure loan products exist
   */
  private async ensureLoanProducts(companyId: string): Promise<LoanProduct[]> {
    const products = [
      {
        productCode: 'PL-001',
        productName: 'Personal Loan',
        companyId,
        rateOfInterest: 8.5,
        penaltyInterestRate: 2.0,
        maximumLoanAmount: 500000,
        isTermLoan: true,
        repaymentScheduleType: RepaymentScheduleType.MONTHLY_AS_PER_START_DATE,
        minDaysBwDisbursementFirstRepayment: 30,
        daysPastDueThresholdForNpa: 90,
        gracePeriodInDays: 0,
        // Mock account IDs - in production these would be real account references
        disbursementAccount: 'acc-disbursement-001',
        paymentAccount: 'acc-payment-001',
        loanAccount: 'acc-loan-001',
        interestIncomeAccount: 'acc-interest-income-001',
        penaltyIncomeAccount: 'acc-penalty-income-001',
        interestAccruedAccount: 'acc-interest-accrued-001',
        interestReceivableAccount: 'acc-interest-receivable-001',
        penaltyAccruedAccount: 'acc-penalty-accrued-001',
        penaltyReceivableAccount: 'acc-penalty-receivable-001',
        securityDepositAccount: 'acc-security-deposit-001',
        customerRefundAccount: 'acc-customer-refund-001',
        writeOffAccount: 'acc-writeoff-001',
        writeOffRecoveryAccount: 'acc-writeoff-recovery-001',
        interestWaiverAccount: 'acc-interest-waiver-001',
        penaltyWaiverAccount: 'acc-penalty-waiver-001',
      },
      {
        productCode: 'SL-001',
        productName: 'Secured Loan',
        companyId,
        rateOfInterest: 7.0,
        penaltyInterestRate: 1.5,
        maximumLoanAmount: 1000000,
        isTermLoan: true,
        repaymentScheduleType: RepaymentScheduleType.MONTHLY_AS_PER_START_DATE,
        minDaysBwDisbursementFirstRepayment: 30,
        daysPastDueThresholdForNpa: 90,
        gracePeriodInDays: 0,
        disbursementAccount: 'acc-disbursement-002',
        paymentAccount: 'acc-payment-002',
        loanAccount: 'acc-loan-002',
        interestIncomeAccount: 'acc-interest-income-002',
        penaltyIncomeAccount: 'acc-penalty-income-002',
        interestAccruedAccount: 'acc-interest-accrued-002',
        interestReceivableAccount: 'acc-interest-receivable-002',
        penaltyAccruedAccount: 'acc-penalty-accrued-002',
        penaltyReceivableAccount: 'acc-penalty-receivable-002',
        securityDepositAccount: 'acc-security-deposit-002',
        customerRefundAccount: 'acc-customer-refund-002',
        writeOffAccount: 'acc-writeoff-002',
        writeOffRecoveryAccount: 'acc-writeoff-recovery-002',
        interestWaiverAccount: 'acc-interest-waiver-002',
        penaltyWaiverAccount: 'acc-penalty-waiver-002',
      },
    ];

    const savedProducts = [];
    for (const productData of products) {
      let product = await this.loanProductRepository.findOne({
        where: { productCode: productData.productCode },
      });

      if (!product) {
        product = this.loanProductRepository.create(productData);
        product = await this.loanProductRepository.save(product);
        this.logger.log(`Created loan product: ${product.productName}`);
      } else {
        this.logger.log(`Loan product already exists: ${product.productName}`);
      }
      savedProducts.push(product);
    }

    return savedProducts;
  }

  /**
   * Create loans from approved applications using the service method
   * This ensures all business rules and validations are applied
   */
  private async createLoansFromApprovedApplications(
    applications: LoanApplication[],
    companyId: string,
  ): Promise<void> {
    const approvedApplications = applications.filter(
      (app) => app.status === ApplicationStatus.APPROVED,
    );

    this.logger.log(
      `Creating loans for ${approvedApplications.length} approved applications...`,
    );

    for (const application of approvedApplications) {
      try {
        // Check if loan already exists
        if (application.loanId) {
          const existingLoan = await this.loanRepository.findOne({
            where: { id: application.loanId },
          });
          if (existingLoan) {
            this.logger.log(
              `Loan already exists for application ${application.applicationNumber}: ${existingLoan.loanNumber}`,
            );
            continue;
          }
        }

        // Use the service method to create loan (ensures all business rules are applied)
        const createdLoan = await this.loanApplicationService.createLoanFromApplication(
          application.id,
          application.companyId,
          false, // Don't auto-submit, keep as SANCTIONED
        );

        this.logger.log(
          `Created loan ${createdLoan.loanNumber} from application ${application.applicationNumber}`,
        );

        // Create disbursement for some loans (70% chance)
        if (Math.random() > 0.3) {
          await this.createDisbursementForLoan(createdLoan, application);
        }
      } catch (error) {
        this.logger.error(
          `Failed to create loan for application ${application.applicationNumber}: ${error.message}`,
          error.stack,
        );
        // Continue with next application even if one fails
      }
    }
  }

  /**
   * Create disbursement for a loan
   */
  private async createDisbursementForLoan(
    loan: Loan,
    application: LoanApplication,
  ): Promise<void> {
    try {
      const disbursementDate = new Date(
        new Date(application.repaymentStartDate || new Date()).getTime() -
          30 * 24 * 60 * 60 * 1000,
      ); // 30 days before repayment start

      const disbursement = this.loanDisbursementRepository.create({
        loanId: loan.id,
        disbursementDate,
        disbursedAmount: loan.loanAmount,
        referenceNumber: `DISB-${loan.loanNumber}`,
        modeOfPayment: 'Bank Transfer',
      });

      await this.loanDisbursementRepository.save(disbursement);
      this.logger.log(
        `Created disbursement for loan: ${loan.loanNumber}`,
      );

      // Update loan status and disbursed amount
      loan.disbursedAmount = loan.loanAmount;
      loan.status = LoanStatus.DISBURSED;
      loan.disbursementDate = disbursementDate;
      await this.loanRepository.save(loan);

      // Create some repayments for disbursed loans (50% chance)
      if (Math.random() > 0.5) {
        await this.createSampleRepayments(loan, loan.companyId);
      }
    } catch (error) {
      this.logger.error(
        `Failed to create disbursement for loan ${loan.loanNumber}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Create sample repayments for a loan
   */
  private async createSampleRepayments(
    loan: Loan,
    companyId: string,
  ): Promise<void> {
    const numberOfRepayments = Math.min(
      Math.floor(Math.random() * 6) + 1,
      loan.repaymentPeriods || 12,
    ); // 1-6 repayments or up to repayment periods

    const monthlyAmount = loan.loanAmount / (loan.repaymentPeriods || 12);

    for (let i = 0; i < numberOfRepayments; i++) {
      const repaymentDate = new Date(loan.repaymentStartDate || new Date());
      repaymentDate.setMonth(repaymentDate.getMonth() + i);

      const repayment = this.loanRepaymentRepository.create({
        loanId: loan.id,
        postingDate: repaymentDate,
        valueDate: repaymentDate,
        amountPaid: monthlyAmount,
        principalPaid: monthlyAmount * 0.85, // 85% principal, 15% interest (simplified)
        interestPaid: monthlyAmount * 0.15,
        penaltyPaid: 0,
        chargesPaid: 0,
        excessAmount: 0,
        referenceNumber: `REPAY-${loan.loanNumber}-${i + 1}`,
        modeOfPayment: 'Bank Transfer',
      });

      await this.loanRepaymentRepository.save(repayment);
    }

    this.logger.log(
      `Created ${numberOfRepayments} repayments for loan: ${loan.loanNumber}`,
    );
  }

  /**
   * Create loans for existing approved applications that don't have loans
   */
  async createLoansForApprovedApplications(): Promise<void> {
    this.logger.log('Creating loans for approved applications without loans...');

    try {
      // Find all approved applications without loans
      const approvedApplications = await this.loanApplicationRepository.find({
        where: {
          status: ApplicationStatus.APPROVED,
        },
      });

      const applicationsWithoutLoans = approvedApplications.filter(
        (app) => !app.loanId,
      );

      if (applicationsWithoutLoans.length === 0) {
        this.logger.log(
          'No approved applications without loans found. All approved applications already have loans.',
        );
        return;
      }

      this.logger.log(
        `Found ${applicationsWithoutLoans.length} approved applications without loans. Creating loans...`,
      );

      // Create loans for these applications
      await this.createLoansFromApprovedApplications(
        applicationsWithoutLoans,
        approvedApplications[0]?.companyId || '',
      );

      this.logger.log(
        `Successfully created loans for ${applicationsWithoutLoans.length} approved applications.`,
      );
    } catch (error) {
      this.logger.error(
        `Error creating loans for approved applications: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Force seed (for development - will create even if data exists)
   */
  async seedLoanApplicationsForce(): Promise<void> {
    this.logger.log('Starting forced loan application seed...');
    // Clear existing data first (use with caution!)
    // await this.loanApplicationRepository.delete({});
    // Then call regular seed
    await this.seedLoanApplications();
  }
}

