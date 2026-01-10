/**
 * Cache Service Integration Examples
 * 
 * This file demonstrates how to integrate the Cache service into existing modules
 */

import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../loan/entities/loan.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';

@Injectable()
export class CachedLoanService {
  constructor(
    private readonly cacheService: CacheService,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Get loan with caching
   */
  async getLoan(loanId: string): Promise<Loan | null> {
    const cacheKey = `loan:${loanId}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const loan = await this.loanRepository.findOne({
          where: { id: loanId },
          relations: ['repayments', 'disbursements'],
        });
        return loan;
      },
      600, // 10 minutes TTL
    );
  }

  /**
   * Get portfolio summary with caching
   */
  async getPortfolioSummary(companyId: string): Promise<any> {
    const cacheKey = `portfolio:summary:${companyId}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Expensive calculation
        const loans = await this.loanRepository.find({
          where: { companyId },
        });

        return {
          totalLoans: loans.length,
          totalAmount: loans.reduce((sum, loan) => sum + loan.loanAmount, 0),
          activeLoans: loans.filter((l) => l.status === LoanStatus.ACTIVE).length,
          // ... more calculations
        };
      },
      300, // 5 minutes TTL
    );
  }

  /**
   * Invalidate loan cache
   */
  async invalidateLoanCache(loanId: string): Promise<void> {
    await this.cacheService.delete(`loan:${loanId}`);
    // Also invalidate related caches
    await this.cacheService.delete(`portfolio:summary:*`);
  }
}

