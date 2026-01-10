import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RateLock, RateLockStatus, RateLockType } from '../entities/rate-lock.entity';
import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { LoanApplication, ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { CreateRateLockDto, ExtendRateLockDto, ExerciseFloatDownDto, CancelRateLockDto } from '../dto/rate-lock.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Service for rate lock management
 * UC-013: Rate Lock Management
 */
@Injectable()
export class RateLockService {
  private readonly logger = new Logger(RateLockService.name);

  constructor(
    @InjectRepository(RateLock)
    private readonly rateLockRepository: Repository<RateLock>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Request rate lock
   */
  async requestRateLock(createDto: CreateRateLockDto, requestedBy: string): Promise<RateLock> {
    // Validate loan or application exists
    if (createDto.loanId) {
      const loan = await this.loanRepository.findOne({ where: { id: createDto.loanId } });
      if (!loan) {
        throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
      }
      // Check if loan already has an active rate lock
      const existingLock = await this.rateLockRepository.findOne({
        where: { loanId: loan.id, status: RateLockStatus.ACTIVE },
      });
      if (existingLock) {
        throw new BadRequestException('Loan already has an active rate lock');
      }
    }

    if (createDto.applicationId) {
      const application = await this.applicationRepository.findOne({ where: { id: createDto.applicationId } });
      if (!application) {
        throw new NotFoundException(`Application with ID ${createDto.applicationId} not found`);
      }
    }

    // Calculate expiry date
    const lockDate = new Date();
    const expiryDate = new Date(lockDate);
    expiryDate.setDate(expiryDate.getDate() + createDto.lockPeriodDays);

    // Get current market rate (mocked - in production, fetch from rate service)
    const currentRate = await this.getCurrentMarketRate();

    const rateLock = this.rateLockRepository.create({
      ...createDto,
      requestedBy,
      lockDate,
      expiryDate,
      currentRate,
      status: RateLockStatus.PENDING,
      lockType: createDto.lockType || RateLockType.STANDARD,
      autoExtend: createDto.autoExtend || false,
      maxExtensions: createDto.maxExtensions || 0,
      floatDownEligible: createDto.floatDownEligible || false,
      floatDownThreshold: createDto.floatDownThreshold || 0.25, // Default 0.25% threshold
    });

    const savedLock = await this.rateLockRepository.save(rateLock);

    this.logger.log(`Rate lock requested: ${savedLock.id} at ${createDto.lockedRate}% for ${createDto.lockPeriodDays} days`);

    return savedLock;
  }

  /**
   * Approve rate lock
   */
  async approveRateLock(rateLockId: string, approvedBy: string, remarks?: string): Promise<RateLock> {
    const rateLock = await this.rateLockRepository.findOne({ where: { id: rateLockId } });

    if (!rateLock) {
      throw new NotFoundException(`Rate lock with ID ${rateLockId} not found`);
    }

    if (rateLock.status !== RateLockStatus.PENDING) {
      throw new BadRequestException(`Rate lock is not in PENDING status. Current status: ${rateLock.status}`);
    }

    rateLock.status = RateLockStatus.ACTIVE;
    rateLock.approvedBy = approvedBy;
    rateLock.approvedDate = new Date();
    rateLock.approvalRemarks = remarks;

    const savedLock = await this.rateLockRepository.save(rateLock);

    this.logger.log(`Rate lock approved: ${rateLockId} by ${approvedBy}`);

    // In production, send notification to borrower
    // await this.notificationService.sendRateLockApproval(savedLock);

    return savedLock;
  }

  /**
   * Extend rate lock
   */
  async extendRateLock(rateLockId: string, extendDto: ExtendRateLockDto, extendedBy: string): Promise<RateLock> {
    const rateLock = await this.rateLockRepository.findOne({ where: { id: rateLockId } });

    if (!rateLock) {
      throw new NotFoundException(`Rate lock with ID ${rateLockId} not found`);
    }

    if (rateLock.status !== RateLockStatus.ACTIVE) {
      throw new BadRequestException(`Rate lock must be ACTIVE to extend. Current status: ${rateLock.status}`);
    }

    // Check extension limit
    if (rateLock.maxExtensions && rateLock.extensionCount >= rateLock.maxExtensions) {
      throw new BadRequestException(
        `Maximum extensions (${rateLock.maxExtensions}) reached for this rate lock`,
      );
    }

    // Calculate new expiry date
    const currentExpiry = rateLock.extendedExpiryDate || rateLock.expiryDate;
    const newExpiryDate = new Date(currentExpiry);
    newExpiryDate.setDate(newExpiryDate.getDate() + extendDto.additionalDays);

    rateLock.extendedExpiryDate = newExpiryDate;
    rateLock.extensionCount = (rateLock.extensionCount || 0) + 1;
    rateLock.status = RateLockStatus.EXTENDED;

    const savedLock = await this.rateLockRepository.save(rateLock);

    this.logger.log(
      `Rate lock extended: ${rateLockId} by ${extendDto.additionalDays} days. New expiry: ${newExpiryDate.toISOString()}`,
    );

    return savedLock;
  }

  /**
   * Exercise float-down option
   */
  async exerciseFloatDown(rateLockId: string, floatDownDto: ExerciseFloatDownDto): Promise<RateLock> {
    const rateLock = await this.rateLockRepository.findOne({ where: { id: rateLockId } });

    if (!rateLock) {
      throw new NotFoundException(`Rate lock with ID ${rateLockId} not found`);
    }

    if (!rateLock.floatDownEligible) {
      throw new BadRequestException('This rate lock does not have float-down option enabled');
    }

    if (rateLock.status !== RateLockStatus.ACTIVE && rateLock.status !== RateLockStatus.EXTENDED) {
      throw new BadRequestException(`Rate lock must be ACTIVE or EXTENDED to exercise float-down`);
    }

    // Validate new rate is lower than locked rate
    if (floatDownDto.newRate >= rateLock.lockedRate) {
      throw new BadRequestException(
        `Float-down rate (${floatDownDto.newRate}%) must be lower than locked rate (${rateLock.lockedRate}%)`,
      );
    }

    // Check if rate drop meets threshold
    const rateDrop = rateLock.lockedRate - floatDownDto.newRate;
    if (rateLock.floatDownThreshold && rateDrop < rateLock.floatDownThreshold) {
      throw new BadRequestException(
        `Rate drop (${rateDrop}%) does not meet minimum threshold (${rateLock.floatDownThreshold}%)`,
      );
    }

    rateLock.floatDownRate = floatDownDto.newRate;
    rateLock.lockedRate = floatDownDto.newRate; // Update locked rate to new rate

    const savedLock = await this.rateLockRepository.save(rateLock);

    this.logger.log(`Float-down exercised: ${rateLockId}. New rate: ${floatDownDto.newRate}%`);

    return savedLock;
  }

  /**
   * Cancel rate lock
   */
  async cancelRateLock(rateLockId: string, cancelDto: CancelRateLockDto, cancelledBy: string): Promise<RateLock> {
    const rateLock = await this.rateLockRepository.findOne({ where: { id: rateLockId } });

    if (!rateLock) {
      throw new NotFoundException(`Rate lock with ID ${rateLockId} not found`);
    }

    if (rateLock.status === RateLockStatus.CANCELLED) {
      throw new BadRequestException('Rate lock is already cancelled');
    }

    rateLock.status = RateLockStatus.CANCELLED;
    rateLock.cancellationReason = cancelDto.cancellationReason;
    rateLock.cancelledBy = cancelledBy;
    rateLock.cancelledDate = new Date();

    const savedLock = await this.rateLockRepository.save(rateLock);

    this.logger.log(`Rate lock cancelled: ${rateLockId}`);

    return savedLock;
  }

  /**
   * Get rate lock by ID
   */
  async getRateLock(rateLockId: string): Promise<RateLock> {
    const rateLock = await this.rateLockRepository.findOne({
      where: { id: rateLockId },
      relations: ['loan', 'application'],
    });

    if (!rateLock) {
      throw new NotFoundException(`Rate lock with ID ${rateLockId} not found`);
    }

    return rateLock;
  }

  /**
   * Get rate locks for loan
   */
  async getRateLocksForLoan(loanId: string): Promise<RateLock[]> {
    return await this.rateLockRepository.find({
      where: { loanId },
      order: { lockDate: 'DESC' },
    });
  }

  /**
   * Get rate locks for application
   */
  async getRateLocksForApplication(applicationId: string): Promise<RateLock[]> {
    return await this.rateLockRepository.find({
      where: { applicationId },
      order: { lockDate: 'DESC' },
    });
  }

  /**
   * Get active rate lock for loan
   */
  async getActiveRateLock(loanId: string): Promise<RateLock | null> {
    return await this.rateLockRepository.findOne({
      where: { loanId, status: RateLockStatus.ACTIVE },
    });
  }

  /**
   * Monitor and expire rate locks (scheduled job)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async monitorRateLockExpiration(): Promise<void> {
    this.logger.log('Running rate lock expiration monitor...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active rate locks that have expired
    const expiredLocks = await this.rateLockRepository
      .createQueryBuilder('lock')
      .where('lock.status IN (:...statuses)', {
        statuses: [RateLockStatus.ACTIVE, RateLockStatus.EXTENDED],
      })
      .andWhere('(lock.extendedExpiryDate IS NOT NULL AND lock.extendedExpiryDate < :today) OR (lock.extendedExpiryDate IS NULL AND lock.expiryDate < :today)', {
        today,
      })
      .getMany();

    for (const lock of expiredLocks) {
      if (lock.autoExtend && lock.maxExtensions && (lock.extensionCount || 0) < lock.maxExtensions) {
        // Auto-extend if enabled and within limit
        const additionalDays = lock.lockPeriodDays; // Extend by original lock period
        lock.extendedExpiryDate = new Date(lock.expiryDate);
        lock.extendedExpiryDate.setDate(lock.extendedExpiryDate.getDate() + additionalDays);
        lock.extensionCount = (lock.extensionCount || 0) + 1;
        lock.status = RateLockStatus.EXTENDED;
        this.logger.log(`Auto-extended rate lock ${lock.id} by ${additionalDays} days`);
      } else {
        // Mark as expired
        lock.status = RateLockStatus.EXPIRED;
        this.logger.log(`Rate lock ${lock.id} expired`);
      }
      await this.rateLockRepository.save(lock);
    }

    this.logger.log(`Processed ${expiredLocks.length} expired rate locks`);
  }

  /**
   * Get current market rate (mocked - in production, fetch from rate service)
   */
  private async getCurrentMarketRate(): Promise<number> {
    // Mock implementation - in production, this would fetch from a rate service
    return 7.5 + Math.random() * 1.5; // Random rate between 7.5% and 9%
  }

  /**
   * Check if rate lock is eligible for float-down
   */
  async checkFloatDownEligibility(rateLockId: string): Promise<{ eligible: boolean; currentRate: number; lockedRate: number; rateDrop: number }> {
    const rateLock = await this.rateLockRepository.findOne({ where: { id: rateLockId } });

    if (!rateLock) {
      throw new NotFoundException(`Rate lock with ID ${rateLockId} not found`);
    }

    if (!rateLock.floatDownEligible) {
      return { eligible: false, currentRate: 0, lockedRate: rateLock.lockedRate, rateDrop: 0 };
    }

    const currentRate = await this.getCurrentMarketRate();
    const rateDrop = rateLock.lockedRate - currentRate;

    const eligible = rateDrop >= (rateLock.floatDownThreshold || 0.25);

    return {
      eligible,
      currentRate,
      lockedRate: rateLock.lockedRate,
      rateDrop,
    };
  }
}

