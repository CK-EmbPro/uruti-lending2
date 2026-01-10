import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { RestructureAcknowledgmentService } from '../restructure-acknowledgment.service';
import { RestructureAcknowledgment, AcknowledgmentMethod } from '../../entities/restructure-acknowledgment.entity';
import { LoanRestructure } from '../../entities/loan-restructure.entity';

describe('RestructureAcknowledgmentService', () => {
  let service: RestructureAcknowledgmentService;
  let acknowledgmentRepository: Repository<RestructureAcknowledgment>;
  let restructureRepository: Repository<LoanRestructure>;

  const mockAcknowledgmentRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRestructureRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestructureAcknowledgmentService,
        {
          provide: getRepositoryToken(RestructureAcknowledgment),
          useValue: mockAcknowledgmentRepository,
        },
        {
          provide: getRepositoryToken(LoanRestructure),
          useValue: mockRestructureRepository,
        },
      ],
    }).compile();

    service = module.get<RestructureAcknowledgmentService>(RestructureAcknowledgmentService);
    acknowledgmentRepository = module.get<Repository<RestructureAcknowledgment>>(
      getRepositoryToken(RestructureAcknowledgment),
    );
    restructureRepository = module.get<Repository<LoanRestructure>>(
      getRepositoryToken(LoanRestructure),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordAcknowledgment', () => {
    const restructureId = 'restructure-123';
    const borrowerId = 'borrower-123';
    const mockRestructure = {
      id: restructureId,
      borrowerAcknowledged: false,
    } as LoanRestructure;

    it('should throw error if restructure not found', async () => {
      mockRestructureRepository.findOne.mockResolvedValue(null);

      await expect(
        service.recordAcknowledgment(
          restructureId,
          borrowerId,
          AcknowledgmentMethod.ELECTRONIC_CONSENT,
          'I acknowledge...',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if already acknowledged', async () => {
      mockRestructureRepository.findOne.mockResolvedValue(mockRestructure);
      mockAcknowledgmentRepository.findOne.mockResolvedValue({
        id: 'ack-1',
        restructureId,
      } as RestructureAcknowledgment);

      await expect(
        service.recordAcknowledgment(
          restructureId,
          borrowerId,
          AcknowledgmentMethod.ELECTRONIC_CONSENT,
          'I acknowledge...',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should record acknowledgment successfully', async () => {
      const acknowledgmentText = 'I acknowledge the terms change';
      const mockAcknowledgment = {
        id: 'ack-1',
        restructureId,
        borrowerId,
        acknowledgedAt: expect.any(Date),
        acknowledgmentMethod: AcknowledgmentMethod.ELECTRONIC_CONSENT,
        acknowledgmentText,
        termsRead: true,
        impactUnderstood: true,
      } as RestructureAcknowledgment;

      mockRestructureRepository.findOne.mockResolvedValue(mockRestructure);
      mockAcknowledgmentRepository.findOne.mockResolvedValue(null);
      mockAcknowledgmentRepository.create.mockReturnValue(mockAcknowledgment);
      mockAcknowledgmentRepository.save.mockResolvedValue(mockAcknowledgment);
      mockRestructureRepository.save.mockResolvedValue({
        ...mockRestructure,
        borrowerAcknowledged: true,
        acknowledgedAt: expect.any(Date),
      });

      const result = await service.recordAcknowledgment(
        restructureId,
        borrowerId,
        AcknowledgmentMethod.ELECTRONIC_CONSENT,
        acknowledgmentText,
        {
          termsRead: true,
          impactUnderstood: true,
        },
      );

      expect(result).toEqual(mockAcknowledgment);
      expect(mockAcknowledgmentRepository.create).toHaveBeenCalled();
      expect(mockAcknowledgmentRepository.save).toHaveBeenCalled();
      expect(mockRestructureRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          borrowerAcknowledged: true,
          acknowledgedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('isAcknowledged', () => {
    it('should return true if acknowledged', async () => {
      const restructureId = 'restructure-123';
      mockAcknowledgmentRepository.findOne.mockResolvedValue({
        id: 'ack-1',
        restructureId,
      } as RestructureAcknowledgment);

      const result = await service.isAcknowledged(restructureId);

      expect(result).toBe(true);
    });

    it('should return false if not acknowledged', async () => {
      const restructureId = 'restructure-123';
      mockAcknowledgmentRepository.findOne.mockResolvedValue(null);

      const result = await service.isAcknowledged(restructureId);

      expect(result).toBe(false);
    });
  });

  describe('validateAcknowledgment', () => {
    it('should throw error if not acknowledged', async () => {
      const restructureId = 'restructure-123';
      mockAcknowledgmentRepository.findOne.mockResolvedValue(null);

      await expect(service.validateAcknowledgment(restructureId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should not throw if acknowledged', async () => {
      const restructureId = 'restructure-123';
      mockAcknowledgmentRepository.findOne.mockResolvedValue({
        id: 'ack-1',
        restructureId,
      } as RestructureAcknowledgment);

      await expect(service.validateAcknowledgment(restructureId)).resolves.not.toThrow();
    });
  });

  describe('getAcknowledgment', () => {
    it('should return acknowledgment if exists', async () => {
      const restructureId = 'restructure-123';
      const mockAcknowledgment = {
        id: 'ack-1',
        restructureId,
      } as RestructureAcknowledgment;

      mockAcknowledgmentRepository.findOne.mockResolvedValue(mockAcknowledgment);

      const result = await service.getAcknowledgment(restructureId);

      expect(result).toEqual(mockAcknowledgment);
    });

    it('should return null if not found', async () => {
      const restructureId = 'restructure-123';
      mockAcknowledgmentRepository.findOne.mockResolvedValue(null);

      const result = await service.getAcknowledgment(restructureId);

      expect(result).toBeNull();
    });
  });
});

