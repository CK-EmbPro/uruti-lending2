import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestructureAcknowledgment, AcknowledgmentMethod } from '../entities/restructure-acknowledgment.entity';
import { LoanRestructure } from '../entities/loan-restructure.entity';

@Injectable()
export class RestructureAcknowledgmentService {
  private readonly logger = new Logger(RestructureAcknowledgmentService.name);

  constructor(
    @InjectRepository(RestructureAcknowledgment)
    private readonly acknowledgmentRepository: Repository<RestructureAcknowledgment>,
    @InjectRepository(LoanRestructure)
    private readonly restructureRepository: Repository<LoanRestructure>,
  ) {}

  /**
   * Record borrower acknowledgment
   */
  async recordAcknowledgment(
    restructureId: string,
    borrowerId: string,
    acknowledgmentMethod: AcknowledgmentMethod,
    acknowledgmentText: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      signatureData?: string;
      termsRead?: boolean;
      impactUnderstood?: boolean;
      notes?: string;
    },
  ): Promise<RestructureAcknowledgment> {
    const restructure = await this.restructureRepository.findOne({
      where: { id: restructureId },
    });

    if (!restructure) {
      throw new BadRequestException(`Restructure ${restructureId} not found`);
    }

    // Check if already acknowledged
    const existing = await this.acknowledgmentRepository.findOne({
      where: { restructureId },
    });

    if (existing) {
      throw new BadRequestException(`Restructure ${restructureId} has already been acknowledged`);
    }

    const acknowledgment = this.acknowledgmentRepository.create({
      restructureId,
      borrowerId,
      acknowledgedAt: new Date(),
      acknowledgmentMethod,
      acknowledgmentText,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      signatureData: options?.signatureData,
      termsRead: options?.termsRead ?? true,
      impactUnderstood: options?.impactUnderstood ?? true,
      notes: options?.notes,
    });

    const saved = await this.acknowledgmentRepository.save(acknowledgment);

    // Update restructure
    restructure.borrowerAcknowledged = true;
    restructure.acknowledgedAt = saved.acknowledgedAt;
    await this.restructureRepository.save(restructure);

    this.logger.log(`Acknowledgment recorded for restructure ${restructureId} by borrower ${borrowerId}`);

    return saved;
  }

  /**
   * Check if restructure has been acknowledged
   */
  async isAcknowledged(restructureId: string): Promise<boolean> {
    const acknowledgment = await this.acknowledgmentRepository.findOne({
      where: { restructureId },
    });

    return acknowledgment !== null;
  }

  /**
   * Get acknowledgment for a restructure
   */
  async getAcknowledgment(restructureId: string): Promise<RestructureAcknowledgment | null> {
    return await this.acknowledgmentRepository.findOne({
      where: { restructureId },
      relations: ['restructure'],
    });
  }

  /**
   * Validate acknowledgment before restructure execution
   */
  async validateAcknowledgment(restructureId: string): Promise<void> {
    const isAck = await this.isAcknowledged(restructureId);

    if (!isAck) {
      throw new BadRequestException(
        `Restructure ${restructureId} cannot be executed without borrower acknowledgment. ` +
        `The borrower must acknowledge the terms change before the restructure can be approved.`,
      );
    }
  }
}

