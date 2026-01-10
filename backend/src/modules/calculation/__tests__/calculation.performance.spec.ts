import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CalculationService } from '../calculation.service';
import { RepaymentFrequency } from '../../../common/enums/repayment-frequency.enum';

/**
 * Performance Tests for Calculation Engine
 * 
 * Requirement: Calculation engine <500ms (p95)
 * 
 * These tests verify that all calculation methods complete within
 * the performance SLA of 500ms for the 95th percentile.
 */
describe('CalculationService - Performance Tests', () => {
  let service: CalculationService;
  let configService: ConfigService;

  const PERFORMANCE_SLA_MS = 500; // 500ms requirement
  const ITERATIONS = 100; // Number of iterations for percentile calculation
  const P95_INDEX = Math.floor(ITERATIONS * 0.95); // Index for 95th percentile

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'currency.precision') return 2;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CalculationService>(CalculationService);
    configService = module.get<ConfigService>(ConfigService);
  });

  /**
   * Helper function to measure execution time
   */
  function measureTime(fn: () => void): number {
    const start = process.hrtime.bigint();
    fn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // Convert to milliseconds
  }

  /**
   * Helper function to calculate percentile
   */
  function calculatePercentile(times: number[], percentile: number): number {
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * percentile);
    return sorted[index];
  }

  describe('calculateEMI - Performance', () => {
    it('should complete EMI calculation in <500ms (p95)', () => {
      const times: number[] = [];

      for (let i = 0; i < ITERATIONS; i++) {
        const time = measureTime(() => {
          service.calculateEMI(100000, 12, 24, RepaymentFrequency.MONTHLY);
        });
        times.push(time);
      }

      const p50 = calculatePercentile(times, 0.5);
      const p95 = calculatePercentile(times, 0.95);
      const p99 = calculatePercentile(times, 0.99);
      const max = Math.max(...times);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`EMI Calculation Performance:`);
      console.log(`  p50: ${p50.toFixed(2)}ms`);
      console.log(`  p95: ${p95.toFixed(2)}ms`);
      console.log(`  p99: ${p99.toFixed(2)}ms`);
      console.log(`  max: ${max.toFixed(2)}ms`);
      console.log(`  avg: ${avg.toFixed(2)}ms`);

      expect(p95).toBeLessThan(PERFORMANCE_SLA_MS);
    });

    it('should handle large loan amounts efficiently', () => {
      const times: number[] = [];

      for (let i = 0; i < ITERATIONS; i++) {
        const time = measureTime(() => {
          service.calculateEMI(10000000, 15.5, 360, RepaymentFrequency.MONTHLY);
        });
        times.push(time);
      }

      const p95 = calculatePercentile(times, 0.95);
      expect(p95).toBeLessThan(PERFORMANCE_SLA_MS);
    });

    it('should handle various frequencies efficiently', () => {
      const frequencies = [
        RepaymentFrequency.MONTHLY,
        RepaymentFrequency.WEEKLY,
        RepaymentFrequency.BI_WEEKLY,
        RepaymentFrequency.QUARTERLY,
        RepaymentFrequency.DAILY,
      ];

      frequencies.forEach((frequency) => {
        const times: number[] = [];

        for (let i = 0; i < ITERATIONS; i++) {
          const time = measureTime(() => {
            service.calculateEMI(100000, 12, 24, frequency);
          });
          times.push(time);
        }

        const p95 = calculatePercentile(times, 0.95);
        expect(p95).toBeLessThan(PERFORMANCE_SLA_MS);
      });
    });
  });

  describe('calculateInterest - Performance', () => {
    it('should complete interest calculation in <500ms (p95)', () => {
      const times: number[] = [];

      for (let i = 0; i < ITERATIONS; i++) {
        const time = measureTime(() => {
          service.calculateInterest(100000, 12, 30, 'Actual/365', new Date());
        });
        times.push(time);
      }

      const p95 = calculatePercentile(times, 0.95);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`Interest Calculation Performance:`);
      console.log(`  p95: ${p95.toFixed(2)}ms`);
      console.log(`  avg: ${avg.toFixed(2)}ms`);

      expect(p95).toBeLessThan(PERFORMANCE_SLA_MS);
    });

    it('should handle various day count conventions efficiently', () => {
      const conventions = ['Actual/365', 'Actual/360', '30/360'];

      conventions.forEach((convention) => {
        const times: number[] = [];

        for (let i = 0; i < ITERATIONS; i++) {
          const time = measureTime(() => {
            service.calculateInterest(100000, 12, 365, convention, new Date());
          });
          times.push(time);
        }

        const p95 = calculatePercentile(times, 0.95);
        expect(p95).toBeLessThan(PERFORMANCE_SLA_MS);
      });
    });
  });

  describe('calculatePenalty - Performance', () => {
    it('should complete penalty calculation in <500ms (p95)', () => {
      const times: number[] = [];

      for (let i = 0; i < ITERATIONS; i++) {
        const time = measureTime(() => {
          service.calculatePenalty(100000, 2, 30, 'Actual/365');
        });
        times.push(time);
      }

      const p95 = calculatePercentile(times, 0.95);
      expect(p95).toBeLessThan(PERFORMANCE_SLA_MS);
    });
  });

  describe('Batch Calculations - Performance', () => {
    it('should handle batch EMI calculations efficiently', () => {
      const loanAmounts = [50000, 100000, 200000, 500000, 1000000];
      const rates = [8, 10, 12, 15, 18];
      const periods = [12, 24, 36, 48, 60];

      const start = process.hrtime.bigint();
      
      let calculations = 0;
      for (const amount of loanAmounts) {
        for (const rate of rates) {
          for (const period of periods) {
            service.calculateEMI(amount, rate, period, RepaymentFrequency.MONTHLY);
            calculations++;
          }
        }
      }

      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1_000_000;
      const avgTime = totalTime / calculations;

      console.log(`Batch EMI Calculations:`);
      console.log(`  Total calculations: ${calculations}`);
      console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average per calculation: ${avgTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(PERFORMANCE_SLA_MS);
    });

    it('should handle concurrent calculation requests', async () => {
      const promises = Array.from({ length: 100 }, () =>
        Promise.resolve(
          measureTime(() => {
            service.calculateEMI(100000, 12, 24, RepaymentFrequency.MONTHLY);
            service.calculateInterest(100000, 12, 30, 'Actual/365', new Date());
            service.calculatePenalty(100000, 2, 30, 'Actual/365');
          }),
        ),
      );

      const times = await Promise.all(promises);
      const p95 = calculatePercentile(times, 0.95);

      expect(p95).toBeLessThan(PERFORMANCE_SLA_MS);
    });
  });

  describe('Performance SLA Compliance', () => {
    it('should meet p95 <500ms requirement for all calculation methods', () => {
      const methods = [
        {
          name: 'calculateEMI',
          fn: () => service.calculateEMI(100000, 12, 24, RepaymentFrequency.MONTHLY),
        },
        {
          name: 'calculateInterest',
          fn: () => service.calculateInterest(100000, 12, 30, 'Actual/365', new Date()),
        },
        {
          name: 'calculatePenalty',
          fn: () => service.calculatePenalty(100000, 2, 30, 'Actual/365'),
        },
      ];

      const results: Record<string, { p95: number; avg: number; max: number }> = {};

      methods.forEach((method) => {
        const times: number[] = [];

        for (let i = 0; i < ITERATIONS; i++) {
          const time = measureTime(method.fn);
          times.push(time);
        }

        const p95 = calculatePercentile(times, 0.95);
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const max = Math.max(...times);

        results[method.name] = { p95, avg, max };

        expect(p95).toBeLessThan(PERFORMANCE_SLA_MS);
      });

      console.log('\n=== Performance SLA Compliance Report ===');
      Object.entries(results).forEach(([method, metrics]) => {
        console.log(`${method}:`);
        console.log(`  p95: ${metrics.p95.toFixed(2)}ms ${metrics.p95 < PERFORMANCE_SLA_MS ? '✅' : '❌'}`);
        console.log(`  avg: ${metrics.avg.toFixed(2)}ms`);
        console.log(`  max: ${metrics.max.toFixed(2)}ms`);
      });
    });
  });
});

