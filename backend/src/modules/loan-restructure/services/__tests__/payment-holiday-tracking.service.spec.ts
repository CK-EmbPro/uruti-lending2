import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { PaymentHolidayTrackingService } from '../payment-holiday-tracking.service';
import { PaymentHoliday, PaymentHolidayStatus } from '../../entities/payment-holiday.entity';
import { Loan } from '../../../loan/entities/loan.entity';

describe('PaymentHolidayTrackingService', () => {
  let service: PaymentHolidayTrackingService;
  let paymentHolidayRepository: Repository<PaymentHoliday>;
  let loanRepository: Repository<Loan>;

  const mockPaymentHolidayRepository = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockLoanRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentHolidayTrackingService,
        {
          provide: getRepositoryToken(PaymentHoliday),
          useValue: mockPaymentHolidayRepository,
        },
        {
          provide: getRepositoryToken(Loan),
          useValue: mockLoanRepository,
        },
      ],
    }).compile();

    service = module.get<PaymentHolidayTrackingService>(PaymentHolidayTrackingService);
    paymentHolidayRepository = module.get<Repository<PaymentHoliday>>(
      getRepositoryToken(PaymentHoliday),
    );
    loanRepository = module.get<Repository<Loan>>(getRepositoryToken(Loan));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePaymentHolidayRequest', () => {
    const loanId = 'loan-123';
    const mockLoan = {
      id: loanId,
      loanNumber: 'LN-001',
    } as Loan;

    it('should throw error if loan not found', async () => {
      mockLoanRepository.findOne.mockResolvedValue(null);

      await expect(service.validatePaymentHolidayRequest(loanId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockLoanRepository.findOne).toHaveBeenCalledWith({ where: { id: loanId } });
    });

    it('should throw error if loan already has 2 active holidays', async () => {
      mockLoanRepository.findOne.mockResolvedValue(mockLoan);
      mockPaymentHolidayRepository.count.mockResolvedValue(2);

      await expect(service.validatePaymentHolidayRequest(loanId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPaymentHolidayRepository.count).toHaveBeenCalledWith({
        where: { loanId, status: PaymentHolidayStatus.ACTIVE },
      });
    });

    it('should throw error if there is an active holiday that has not ended', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);

      mockLoanRepository.findOne.mockResolvedValue(mockLoan);
      mockPaymentHolidayRepository.count.mockResolvedValue(1);
      mockPaymentHolidayRepository.findOne.mockResolvedValue({
        id: 'holiday-1',
        loanId,
        endDate: futureDate,
        status: PaymentHolidayStatus.ACTIVE,
      });

      await expect(service.validatePaymentHolidayRequest(loanId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow request if loan has less than 2 holidays and no active holiday', async () => {
      mockLoanRepository.findOne.mockResolvedValue(mockLoan);
      mockPaymentHolidayRepository.count.mockResolvedValue(1);
      mockPaymentHolidayRepository.findOne.mockResolvedValue(null);

      await expect(service.validatePaymentHolidayRequest(loanId)).resolves.not.toThrow();
    });

    it('should allow request if loan has 0 holidays', async () => {
      mockLoanRepository.findOne.mockResolvedValue(mockLoan);
      mockPaymentHolidayRepository.count.mockResolvedValue(0);
      mockPaymentHolidayRepository.findOne.mockResolvedValue(null);

      await expect(service.validatePaymentHolidayRequest(loanId)).resolves.not.toThrow();
    });
  });

  describe('getPaymentHolidayCount', () => {
    it('should return count of active payment holidays', async () => {
      const loanId = 'loan-123';
      mockPaymentHolidayRepository.count.mockResolvedValue(1);

      const count = await service.getPaymentHolidayCount(loanId);

      expect(count).toBe(1);
      expect(mockPaymentHolidayRepository.count).toHaveBeenCalledWith({
        where: { loanId, status: PaymentHolidayStatus.ACTIVE },
      });
    });
  });

  describe('recordPaymentHoliday', () => {
    it('should record a new payment holiday after validation', async () => {
      const loanId = 'loan-123';
      const companyId = 'company-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-01');
      const durationMonths = 2;

      const mockLoan = { id: loanId } as Loan;
      const mockHoliday = {
        id: 'holiday-1',
        loanId,
        companyId,
        startDate,
        endDate,
        durationMonths,
        status: PaymentHolidayStatus.ACTIVE,
      } as PaymentHoliday;

      mockLoanRepository.findOne.mockResolvedValue(mockLoan);
      mockPaymentHolidayRepository.count.mockResolvedValue(0);
      mockPaymentHolidayRepository.findOne.mockResolvedValue(null);
      mockPaymentHolidayRepository.create.mockReturnValue(mockHoliday);
      mockPaymentHolidayRepository.save.mockResolvedValue(mockHoliday);

      const result = await service.recordPaymentHoliday(
        loanId,
        companyId,
        startDate,
        endDate,
        durationMonths,
      );

      expect(result).toEqual(mockHoliday);
      expect(mockPaymentHolidayRepository.create).toHaveBeenCalled();
      expect(mockPaymentHolidayRepository.save).toHaveBeenCalled();
    });

    it('should throw error if validation fails', async () => {
      const loanId = 'loan-123';
      mockLoanRepository.findOne.mockResolvedValue(null);

      await expect(
        service.recordPaymentHoliday(
          loanId,
          'company-123',
          new Date(),
          new Date(),
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completePaymentHoliday', () => {
    it('should complete a payment holiday', async () => {
      const holidayId = 'holiday-1';
      const mockHoliday = {
        id: holidayId,
        status: PaymentHolidayStatus.ACTIVE,
      } as PaymentHoliday;

      mockPaymentHolidayRepository.findOne.mockResolvedValue(mockHoliday);
      mockPaymentHolidayRepository.save.mockResolvedValue({
        ...mockHoliday,
        status: PaymentHolidayStatus.COMPLETED,
        completedDate: expect.any(Date),
      });

      const result = await service.completePaymentHoliday(holidayId);

      expect(result.status).toBe(PaymentHolidayStatus.COMPLETED);
      expect(result.completedDate).toBeDefined();
    });

    it('should throw error if holiday not found', async () => {
      mockPaymentHolidayRepository.findOne.mockResolvedValue(null);

      await expect(service.completePaymentHoliday('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

