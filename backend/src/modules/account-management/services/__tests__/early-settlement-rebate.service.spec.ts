import { Test, TestingModule } from '@nestjs/testing';
import { EarlySettlementRebateService } from '../early-settlement-rebate.service';
import { Loan, LoanStatus } from '../../../loan/entities/loan.entity';

describe('EarlySettlementRebateService', () => {
  let service: EarlySettlementRebateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EarlySettlementRebateService],
    }).compile();

    service = module.get<EarlySettlementRebateService>(EarlySettlementRebateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRebate', () => {
    const baseLoan: Partial<Loan> = {
      id: 'loan-1',
      loanAmount: 100000,
      totalPrincipalPaid: 0,
      rateOfInterest: 12,
      repaymentPeriods: 24, // 24 months
      disbursementDate: new Date('2024-01-01'),
      postingDate: new Date('2024-01-01'),
      status: LoanStatus.ACTIVE,
    };

    it('should calculate 50% rebate for >12 months remaining', () => {
      const loan = { ...baseLoan } as Loan;
      const payoffDate = new Date('2024-02-01'); // 22 months remaining
      const accruedInterest = 1000;

      const result = service.calculateRebate(loan, payoffDate, accruedInterest);

      expect(result.rebatePercentage).toBe(50);
      expect(result.rebateAmount).toBe(500); // 50% of 1000
      expect(result.monthsRemaining).toBeGreaterThan(12);
    });

    it('should calculate 30% rebate for 6-12 months remaining', () => {
      const loan = { ...baseLoan } as Loan;
      const payoffDate = new Date('2024-07-01'); // 18 months remaining (6 months into loan)
      const accruedInterest = 1000;

      const result = service.calculateRebate(loan, payoffDate, accruedInterest);

      expect(result.rebatePercentage).toBe(30);
      expect(result.rebateAmount).toBe(300); // 30% of 1000
      expect(result.monthsRemaining).toBeGreaterThanOrEqual(6);
      expect(result.monthsRemaining).toBeLessThanOrEqual(12);
    });

    it('should calculate 15% rebate for 3-6 months remaining', () => {
      const loan = { ...baseLoan } as Loan;
      // 19 months into 24-month loan = 5 months remaining (within 3-6 range)
      // Loan ends Jan 1, 2026, so Aug 1, 2025 = 5 months remaining
      const payoffDate = new Date('2025-08-01');
      const accruedInterest = 1000;

      const result = service.calculateRebate(loan, payoffDate, accruedInterest);

      expect(result.rebatePercentage).toBe(15);
      expect(result.rebateAmount).toBe(150); // 15% of 1000
      expect(result.monthsRemaining).toBeGreaterThanOrEqual(3);
      expect(result.monthsRemaining).toBeLessThan(6);
    });

    it('should calculate 5% rebate for <3 months remaining', () => {
      const loan = { ...baseLoan } as Loan;
      // 22 months into 24-month loan = 2 months remaining (within <3 range)
      // Loan ends Jan 1, 2026, so Nov 1, 2025 = 2 months remaining
      const payoffDate = new Date('2025-11-01');
      const accruedInterest = 1000;

      const result = service.calculateRebate(loan, payoffDate, accruedInterest);

      expect(result.rebatePercentage).toBe(5);
      expect(result.rebateAmount).toBe(50); // 5% of 1000
      expect(result.monthsRemaining).toBeGreaterThan(0);
      expect(result.monthsRemaining).toBeLessThan(3);
    });

    it('should calculate 0% rebate for 0 months remaining', () => {
      const loan = { ...baseLoan } as Loan;
      const payoffDate = new Date('2026-01-01'); // Loan end date
      const accruedInterest = 1000;

      const result = service.calculateRebate(loan, payoffDate, accruedInterest);

      expect(result.rebatePercentage).toBe(0);
      expect(result.rebateAmount).toBe(0);
      expect(result.monthsRemaining).toBe(0);
    });

    it('should calculate rebated payoff amount correctly', () => {
      const loan = { ...baseLoan } as Loan;
      const payoffDate = new Date('2024-02-01');
      const accruedInterest = 1000;
      const principalBalance = 100000;

      const result = service.calculateRebate(loan, payoffDate, accruedInterest);

      expect(result.originalPayoffAmount).toBe(principalBalance + accruedInterest);
      expect(result.rebatedPayoffAmount).toBe(principalBalance + accruedInterest - result.rebateAmount);
      expect(result.rebatedPayoffAmount).toBeLessThan(result.originalPayoffAmount);
    });

    it('should calculate total savings including future interest', () => {
      const loan = { ...baseLoan } as Loan;
      const payoffDate = new Date('2024-02-01');
      const accruedInterest = 1000;

      const result = service.calculateRebate(loan, payoffDate, accruedInterest);

      expect(result.totalSavings).toBeGreaterThan(result.rebateAmount);
      expect(result.totalSavings).toBeGreaterThan(0);
    });

    it('should handle loan with partial principal paid', () => {
      const loan = {
        ...baseLoan,
        totalPrincipalPaid: 20000, // 20% paid
      } as Loan;
      const payoffDate = new Date('2024-02-01');
      const accruedInterest = 800; // Less interest on remaining balance

      const result = service.calculateRebate(loan, payoffDate, accruedInterest);

      expect(result.rebatePercentage).toBe(50);
      expect(result.rebateAmount).toBe(400); // 50% of 800
      expect(result.originalPayoffAmount).toBe(80000 + 800); // Remaining principal + interest
    });

    it('should calculate days remaining correctly', () => {
      const loan = { ...baseLoan } as Loan;
      const payoffDate = new Date('2024-02-01');
      const accruedInterest = 1000;

      const result = service.calculateRebate(loan, payoffDate, accruedInterest);

      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.daysRemaining).toBeLessThanOrEqual(730); // ~24 months
    });
  });

  describe('getRebateFormulaDescription', () => {
    it('should return rebate formula description', () => {
      const description = service.getRebateFormulaDescription();

      expect(description).toContain('Interest Rebate Formula');
      expect(description).toContain('50%');
      expect(description).toContain('30%');
      expect(description).toContain('15%');
      expect(description).toContain('5%');
    });
  });
});

