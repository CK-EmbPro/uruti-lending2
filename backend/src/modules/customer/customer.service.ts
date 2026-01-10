import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../loan/entities/loan.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { ApplicantType } from '../../common/enums/applicant-type.enum';
import { CheckDuplicateCustomerDto } from './dto/check-duplicate.dto';
import { DuplicateResultDto } from './dto/duplicate-result.dto';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Check for duplicate customers based on various criteria
   * This is a simplified version - in a real system, you'd have a Customer entity
   * For now, we check based on loans with matching applicant information
   */
  async checkDuplicateCustomer(
    dto: CheckDuplicateCustomerDto,
  ): Promise<DuplicateResultDto> {
    const matchingFields: string[] = [];
    const duplicateIds = new Set<string>();

    // Build query to find loans with matching applicant information
    const query = this.loanRepository.createQueryBuilder('loan');

    query.where('loan.applicantType = :applicantType', {
      applicantType: dto.applicantType,
    });

    if (dto.companyId) {
      query.andWhere('loan.companyId = :companyId', {
        companyId: dto.companyId,
      });
    }

    // Note: In a real system, you'd query a Customer/Party entity
    // For now, we'll use loan data as a proxy
    // This assumes customer information is stored elsewhere and linked via applicantId

    // Since we don't have direct access to customer details in the loan entity,
    // this is a placeholder implementation
    // In production, you would:
    // 1. Query a Customer/Party entity with fields like name, email, phone, PAN, Aadhaar
    // 2. Use fuzzy matching for names
    // 3. Exact matching for unique identifiers (PAN, Aadhaar, email, phone)

    // For demonstration, we'll return a structure that shows how this would work
    // In practice, you'd need to:
    // - Join with Customer/Party table
    // - Match on: name (fuzzy), email (exact), phone (exact), PAN (exact), Aadhaar (exact)

    // Example logic (would need Customer entity):
    /*
    if (dto.email) {
      query.andWhere('customer.email = :email', { email: dto.email });
      matchingFields.push('email');
    }
    if (dto.phone) {
      query.andWhere('customer.phone = :phone', { phone: dto.phone });
      matchingFields.push('phone');
    }
    if (dto.pan) {
      query.andWhere('customer.pan = :pan', { pan: dto.pan });
      matchingFields.push('pan');
    }
    if (dto.aadhaar) {
      query.andWhere('customer.aadhaar = :aadhaar', { aadhaar: dto.aadhaar });
      matchingFields.push('aadhaar');
    }
    if (dto.name) {
      // Fuzzy name matching (using similarity or Levenshtein distance)
      query.andWhere('SIMILARITY(customer.name, :name) > 0.7', { name: dto.name });
      matchingFields.push('name');
    }

    const results = await query.getMany();
    results.forEach(loan => duplicateIds.add(loan.applicantId));
    */

    // Placeholder: Return structure showing no duplicates found
    // In production, implement the above logic with actual Customer entity
    return {
      hasDuplicates: duplicateIds.size > 0,
      duplicateCount: duplicateIds.size,
      duplicateIds: Array.from(duplicateIds),
      matchingFields,
    };
  }

  /**
   * Get all loans for a customer/applicant
   */
  async getCustomerLoans(
    applicantType: ApplicantType,
    applicantId: string,
    companyId: string,
  ): Promise<Loan[]> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    const query = this.loanRepository.createQueryBuilder('loan');

    query.where('loan.applicantType = :applicantType', { applicantType });
    query.andWhere('loan.applicantId = :applicantId', { applicantId });
    query.andWhere('loan.companyId = :companyId', { companyId }); // Enforce company isolation

    return query.getMany();
  }

  /**
   * Get customer summary (total loans, outstanding, etc.)
   */
  async getCustomerSummary(
    applicantType: ApplicantType,
    applicantId: string,
    companyId: string,
  ): Promise<{
    totalLoans: number;
    activeLoans: number;
    totalDisbursed: number;
    totalOutstanding: number;
    totalPrincipalOutstanding: number;
    totalInterestOutstanding: number;
    npaLoans: number;
  }> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    const loans = await this.getCustomerLoans(
      applicantType,
      applicantId,
      companyId,
    );

    const totalLoans = loans.length;
    const activeLoans = loans.filter(
      (loan) =>
        loan.status === LoanStatus.ACTIVE ||
        loan.status === LoanStatus.DISBURSED ||
        loan.status === LoanStatus.PARTIALLY_DISBURSED,
    ).length;

    const totalDisbursed = loans.reduce(
      (sum, loan) => sum + Number(loan.disbursedAmount || 0),
      0,
    );

    const totalOutstanding = loans.reduce((sum, loan) => {
      const outstanding =
        Number(loan.disbursedAmount || 0) -
        Number(loan.totalPrincipalPaid || 0) +
        Number(loan.totalInterestPayable || 0);
      return sum + Math.max(0, outstanding);
    }, 0);

    const totalPrincipalOutstanding = loans.reduce(
      (sum, loan) =>
        sum +
        Math.max(
          0,
          Number(loan.disbursedAmount || 0) -
            Number(loan.totalPrincipalPaid || 0),
        ),
      0,
    );

    const totalInterestOutstanding = loans.reduce(
      (sum, loan) => sum + Number(loan.totalInterestPayable || 0),
      0,
    );

    const npaLoans = loans.filter((loan) => loan.isNpa).length;

    return {
      totalLoans,
      activeLoans,
      totalDisbursed,
      totalOutstanding,
      totalPrincipalOutstanding,
      totalInterestOutstanding,
      npaLoans,
    };
  }

  /**
   * Create or find customer from external customer data
   * 
   * This method handles external customer creation/mapping for integration scenarios.
   * Currently, since there's no Customer entity, it returns the externalCustomerId.
   * When a Customer entity is added, this method should:
   * 1. Check if customer exists by externalCustomerId (via mapping table)
   * 2. If exists, return the internal customer ID
   * 3. If not, create a new Customer record and mapping
   * 4. Store customer details (name, email, phone, etc.)
   * 
   * @param externalCustomerId - External platform's customer ID
   * @param customerData - Customer information from external platform
   * @param platformId - ID of the external platform
   * @returns Internal customer/applicant ID to use
   */
  async createOrFindExternalCustomer(
    externalCustomerId: string,
    customerData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      kycStatus?: string;
      creditScore?: number;
      metadata?: Record<string, any>;
    },
    platformId?: string,
  ): Promise<string> {
    // TODO: When Customer entity is implemented:
    // 1. Check ExternalCustomerMapping table for existing mapping
    // 2. If mapping exists, return internal customer ID
    // 3. If not, create Customer entity with provided data
    // 4. Create ExternalCustomerMapping record
    // 5. Return internal customer ID

    // For now, return externalCustomerId as applicantId
    // This maintains backward compatibility with current implementation
    this.logger.debug(
      `Using external customer ID as applicant ID: ${externalCustomerId} (platform: ${platformId})`,
    );

    return externalCustomerId;
  }

  /**
   * Get internal customer ID from external customer ID
   * 
   * @param externalCustomerId - External platform's customer ID
   * @param platformId - ID of the external platform (optional)
   * @returns Internal customer/applicant ID, or null if not found
   */
  async getInternalCustomerId(
    externalCustomerId: string,
    platformId?: string,
  ): Promise<string | null> {
    // TODO: When Customer entity is implemented:
    // 1. Query ExternalCustomerMapping table
    // 2. Find mapping by externalCustomerId and platformId
    // 3. Return internal customer ID

    // For now, return externalCustomerId (current behavior)
    return externalCustomerId;
  }

  /**
   * Check if a customer exists by external customer ID
   * 
   * @param externalCustomerId - External platform's customer ID
   * @param platformId - ID of the external platform (optional)
   * @returns true if customer exists, false otherwise
   */
  async externalCustomerExists(
    externalCustomerId: string,
    platformId?: string,
  ): Promise<boolean> {
    // TODO: When Customer entity is implemented:
    // 1. Query ExternalCustomerMapping table
    // 2. Check if mapping exists

    // For now, always return true (assume customer exists)
    return true;
  }

  /**
   * Update customer information from external platform
   * 
   * @param externalCustomerId - External platform's customer ID
   * @param customerData - Updated customer information
   * @param platformId - ID of the external platform (optional)
   */
  async updateExternalCustomer(
    externalCustomerId: string,
    customerData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      kycStatus?: string;
      creditScore?: number;
      metadata?: Record<string, any>;
    },
    platformId?: string,
  ): Promise<void> {
    // TODO: When Customer entity is implemented:
    // 1. Get internal customer ID from mapping
    // 2. Update Customer entity with new data
    // 3. Log update in audit trail

    this.logger.debug(
      `Customer update requested for external customer: ${externalCustomerId} (platform: ${platformId})`,
    );
  }
}

