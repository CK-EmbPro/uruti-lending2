import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LoanSecurityShortfall, LoanSecurityShortfallStatus } from './entities/loan-security-shortfall.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { LoanSecurityPriceService } from '../loan-security-price/loan-security-price.service';
import { LoanSecurityAssignmentService } from '../loan-security-assignment/loan-security-assignment.service';

@Injectable()
export class LoanSecurityShortfallService {
  // Default LTV ratio if not found in security type (can be configured later)
  private readonly DEFAULT_LTV_RATIO = 80; // 80%

  constructor(
    @InjectRepository(LoanSecurityShortfall)
    private readonly shortfallRepository: Repository<LoanSecurityShortfall>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly priceService: LoanSecurityPriceService,
    @Inject(forwardRef(() => LoanSecurityAssignmentService))
    private readonly assignmentService: LoanSecurityAssignmentService,
  ) {}

  /**
   * Check for LTV shortfall across all secured loans
   * Implements Frappe's check_for_ltv_shortfall logic
   */
  async checkForLtvShortfall(processLoanSecurityShortfall?: string): Promise<{
    checked: number;
    shortfallsCreated: number;
    shortfallsResolved: number;
  }> {
    const updateTime = new Date();

    // Get all active secured loans
    const loans = await this.loanRepository.find({
      where: {
        status: In([LoanStatus.DISBURSED, LoanStatus.PARTIALLY_DISBURSED]),
        isSecuredLoan: true,
      },
      relations: ['loanProduct'],
    });

    // Get all pending shortfalls
    const pendingShortfalls = await this.shortfallRepository.find({
      where: { status: LoanSecurityShortfallStatus.PENDING },
    });
    const shortfallMap = new Map<string, LoanSecurityShortfall>();
    for (const shortfall of pendingShortfalls) {
      shortfallMap.set(shortfall.loanId, shortfall);
    }

    let shortfallsCreated = 0;
    let shortfallsResolved = 0;

    for (const loan of loans) {
      // Calculate outstanding amount
      const outstandingAmount = this.calculateOutstandingAmount(loan);

      // Get pledged security quantities
      const pledgedQty = await this.assignmentService.getPledgedSecurityQty(loan.id);

      if (pledgedQty.size === 0) {
        continue; // No pledged securities
      }

      // Get current prices for all pledged securities
      const securityIds = Array.from(pledgedQty.keys());
      const currentPrices = await this.priceService.getPricesForSecurities(
        securityIds,
        updateTime,
      );

      // Calculate security value and get LTV ratio
      let securityValue = 0;
      let ltvRatio = this.DEFAULT_LTV_RATIO;

      // Get assignments to access security details
      const assignments = await this.assignmentService.findByLoanId(loan.id);
      
      for (const assignment of assignments) {
        for (const pledge of assignment.pledges) {
          const qty = Number(pledge.qty);
          const currentPrice = currentPrices.get(pledge.loanSecurityId);

          if (currentPrice !== undefined) {
            securityValue += qty * currentPrice;
          } else {
            // Fallback to pledge price
            securityValue += Number(pledge.amount);
          }

          // Get LTV ratio from first security (Frappe logic)
          if (ltvRatio === this.DEFAULT_LTV_RATIO) {
            // TODO: Get LTV ratio from LoanSecurityType entity when available
            // For now, using default
            ltvRatio = this.DEFAULT_LTV_RATIO;
          }
        }
      }

      if (securityValue === 0) {
        continue; // No security value
      }

      // Calculate current ratio
      const currentRatio = (outstandingAmount / securityValue) * 100;

      // Check if shortfall exists
      if (currentRatio > ltvRatio) {
        // Shortfall detected
        const shortfallAmount = outstandingAmount - (securityValue * ltvRatio) / 100;
        
        await this.createLoanSecurityShortfall(
          loan.id,
          outstandingAmount,
          securityValue,
          shortfallAmount,
          currentRatio,
          processLoanSecurityShortfall,
        );
        shortfallsCreated++;
      } else {
        // Check if existing shortfall should be resolved
        const existingShortfall = shortfallMap.get(loan.id);
        if (existingShortfall) {
          const shortfallAmount = outstandingAmount - (securityValue * ltvRatio) / 100;
          if (shortfallAmount <= 0) {
            await this.updatePendingShortfall(existingShortfall.id);
            shortfallsResolved++;
          }
        }
      }
    }

    return {
      checked: loans.length,
      shortfallsCreated,
      shortfallsResolved,
    };
  }

  /**
   * Create or update loan security shortfall
   * Implements Frappe's create_loan_security_shortfall logic
   */
  async createLoanSecurityShortfall(
    loanId: string,
    outstandingAmount: number,
    securityValue: number,
    shortfallAmount: number,
    shortfallRatio: number,
    processLoanSecurityShortfall?: string,
  ): Promise<LoanSecurityShortfall> {
    // Check for existing pending shortfall
    const existingShortfall = await this.shortfallRepository.findOne({
      where: {
        loanId,
        status: LoanSecurityShortfallStatus.PENDING,
      },
    });

    let shortfall: LoanSecurityShortfall;

    if (existingShortfall) {
      shortfall = existingShortfall;
    } else {
      shortfall = this.shortfallRepository.create({
        loanId,
        status: LoanSecurityShortfallStatus.PENDING,
      });
    }

    shortfall.shortfallTime = new Date();
    shortfall.outstandingAmount = outstandingAmount;
    shortfall.securityValue = securityValue;
    shortfall.shortfallAmount = shortfallAmount;
    shortfall.shortfallRatio = shortfallRatio;
    if (processLoanSecurityShortfall) {
      shortfall.processLoanSecurityShortfall = processLoanSecurityShortfall;
    }

    return await this.shortfallRepository.save(shortfall);
  }

  /**
   * Update pending shortfall to resolved
   * Implements Frappe's update_pending_shortfall logic
   */
  async updatePendingShortfall(shortfallId: string): Promise<LoanSecurityShortfall> {
    const shortfall = await this.findOne(shortfallId);
    shortfall.status = LoanSecurityShortfallStatus.RESOLVED;
    shortfall.shortfallAmount = 0;
    shortfall.shortfallRatio = 0;
    shortfall.resolvedDate = new Date();
    return await this.shortfallRepository.save(shortfall);
  }

  /**
   * Calculate outstanding amount for a loan
   * Based on Frappe logic: total_payment - total_interest_payable - total_principal_paid
   */
  private calculateOutstandingAmount(loan: Loan): number {
    if (loan.status === LoanStatus.DISBURSED) {
      return (
        Number(loan.totalPayment || 0) -
        Number(loan.totalInterestPayable || 0) -
        Number(loan.totalPrincipalPaid || 0)
      );
    } else {
      // Partially disbursed
      return (
        Number(loan.disbursedAmount || 0) -
        Number(loan.totalInterestPayable || 0) -
        Number(loan.totalPrincipalPaid || 0)
      );
    }
  }

  async findPendingShortfallByLoanId(loanId: string): Promise<LoanSecurityShortfall | null> {
    return await this.shortfallRepository.findOne({
      where: {
        loanId,
        status: LoanSecurityShortfallStatus.PENDING,
      },
    });
  }

  async hasPendingShortfall(loanId: string): Promise<boolean> {
    const shortfall = await this.findPendingShortfallByLoanId(loanId);
    return shortfall !== null;
  }

  async findAll(loanId?: string): Promise<LoanSecurityShortfall[]> {
    if (loanId) {
      return await this.shortfallRepository.find({
        where: { loanId },
        order: { createdAt: 'DESC' },
      });
    }
    return await this.shortfallRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LoanSecurityShortfall> {
    const shortfall = await this.shortfallRepository.findOne({
      where: { id },
    });

    if (!shortfall) {
      throw new NotFoundException(`Security shortfall with ID ${id} not found`);
    }

    return shortfall;
  }

  async resolveShortfall(id: string): Promise<LoanSecurityShortfall> {
    const shortfall = await this.findOne(id);
    shortfall.status = LoanSecurityShortfallStatus.RESOLVED;
    shortfall.resolvedDate = new Date();
    return await this.shortfallRepository.save(shortfall);
  }
}

