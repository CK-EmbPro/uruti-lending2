import { Test, TestingModule } from '@nestjs/testing';
import { RepaymentStructureService } from '../repayment-structure.service';
import { CalculationService } from '../../../calculation/calculation.service';
import { RepaymentStructureType } from '../../../../common/enums/repayment-schedule-type.enum';

describe('RepaymentStructureService', () => {
  let service: RepaymentStructureService;
  let calculationService: CalculationService;

  const mockCalculationService = {
    calculateEMI: jest.fn((amount, rate, periods, frequency) => {
      // Simple EMI calculation for testing
      const monthlyRate = rate / (12 * 100);
      return (amount * monthlyRate * Math.pow(1 + monthlyRate, periods)) / 
             (Math.pow(1 + monthlyRate, periods) - 1);
    }),
    calculateInterest: jest.fn((principal, rate, days, method, date) => {
      // Simple interest calculation for testing
      return (principal * rate * days) / (365 * 100);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepaymentStructureService,
        {
          provide: CalculationService,
          useValue: mockCalculationService,
        },
      ],
    }).compile();

    service = module.get<RepaymentStructureService>(RepaymentStructureService);
    calculationService = module.get<CalculationService>(CalculationService);
  });

  describe('calculateFixedStructure', () => {
    it('should calculate fixed payment structure correctly', () => {
      const dto = {
        loanAmount: 1000,
        interestRate: 12,
        tenureMonths: 12,
        repaymentFrequency: 'Monthly' as const,
      };

      const result = service.calculateFixedStructure(dto);

      expect(result.structureType).toBe(RepaymentStructureType.FIXED);
      expect(result.totalAmount).toBeGreaterThan(1000); // Should include interest
      expect(result.monthlyPayments.length).toBe(12);
      expect(result.minPayment).toBe(result.maxPayment); // Fixed payments are equal
      expect(result.monthlyPayments[0].balance).toBeLessThan(1000);
      expect(result.monthlyPayments[11].balance).toBeCloseTo(0, 1);
    });
  });

  describe('calculateGraduatedStructure', () => {
    it('should calculate graduated payment structure correctly', () => {
      const dto = {
        loanAmount: 1000,
        interestRate: 12,
        tenureMonths: 12,
        repaymentFrequency: 'Monthly' as const,
        graduationRate: 5,
      };

      const result = service.calculateGraduatedStructure(dto);

      expect(result.structureType).toBe(RepaymentStructureType.GRADUATED);
      expect(result.totalAmount).toBeGreaterThan(1000);
      expect(result.monthlyPayments.length).toBe(12);
      expect(result.minPayment).toBeLessThan(result.maxPayment); // Payments increase
      expect(result.monthlyPayments[0].payment).toBeLessThan(result.monthlyPayments[11].payment);
    });
  });

  describe('calculateSeasonalStructure', () => {
    it('should calculate seasonal payment structure correctly', () => {
      const dto = {
        loanAmount: 1000,
        interestRate: 12,
        tenureMonths: 12,
        repaymentFrequency: 'Monthly' as const,
        seasonalPattern: {
          high: [11, 12, 1, 2],
          low: [6, 7, 8],
          highMultiplier: 1.5,
          lowMultiplier: 0.7,
        },
      };

      const result = service.calculateSeasonalStructure(dto);

      expect(result.structureType).toBe(RepaymentStructureType.SEASONAL);
      expect(result.totalAmount).toBeGreaterThan(1000);
      expect(result.monthlyPayments.length).toBe(12);
      // Check that high season payments are higher
      const highSeasonPayment = result.monthlyPayments[10].payment; // Month 11
      const lowSeasonPayment = result.monthlyPayments[5].payment; // Month 6
      expect(highSeasonPayment).toBeGreaterThan(lowSeasonPayment);
    });
  });

  describe('calculateBulletStructure', () => {
    it('should calculate bullet payment structure correctly', () => {
      const dto = {
        loanAmount: 1000,
        interestRate: 12,
        tenureMonths: 12,
        repaymentFrequency: 'Monthly' as const,
      };

      const result = service.calculateBulletStructure(dto);

      expect(result.structureType).toBe(RepaymentStructureType.BULLET);
      expect(result.totalAmount).toBeGreaterThan(1000);
      expect(result.monthlyPayments.length).toBe(12);
      // First 11 payments should be interest-only
      for (let i = 0; i < 11; i++) {
        expect(result.monthlyPayments[i].principal).toBe(0);
        expect(result.monthlyPayments[i].balance).toBe(1000);
      }
      // Last payment should include full principal
      expect(result.monthlyPayments[11].principal).toBe(1000);
      expect(result.monthlyPayments[11].balance).toBe(0);
    });
  });

  describe('calculateAllStructures', () => {
    it('should calculate all structures for comparison', () => {
      const dto = {
        loanAmount: 1000,
        interestRate: 12,
        tenureMonths: 12,
        repaymentFrequency: 'Monthly' as const,
      };

      const results = service.calculateAllStructures(dto);

      expect(results.fixed).toBeDefined();
      expect(results.graduated).toBeDefined();
      expect(results.seasonal).toBeDefined();
      expect(results.bullet).toBeDefined();

      // All should have same loan amount
      expect(results.fixed.totalAmount).toBeGreaterThan(1000);
      expect(results.graduated.totalAmount).toBeGreaterThan(1000);
      expect(results.seasonal.totalAmount).toBeGreaterThan(1000);
      expect(results.bullet.totalAmount).toBeGreaterThan(1000);
    });
  });
});

