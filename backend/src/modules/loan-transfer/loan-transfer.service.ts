import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanTransfer } from './entities/loan-transfer.entity';
import { Loan } from '../loan/entities/loan.entity';
import { ApplicantType } from '../../common/enums/applicant-type.enum';

@Injectable()
export class LoanTransferService {
  constructor(
    @InjectRepository(LoanTransfer)
    private readonly transferRepository: Repository<LoanTransfer>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Create a loan transfer record
   */
  async createTransfer(
    loanId: string,
    oldApplicantType: ApplicantType,
    oldApplicantId: string,
    newApplicantType: ApplicantType,
    newApplicantId: string,
    transferDate: Date,
    referenceNumber?: string,
    remarks?: string,
    transferredBy?: string,
  ): Promise<LoanTransfer> {
    const transfer = this.transferRepository.create({
      loanId,
      oldApplicantType,
      oldApplicantId,
      newApplicantType,
      newApplicantId,
      transferDate,
      referenceNumber,
      remarks,
      transferredBy,
    });

    return await this.transferRepository.save(transfer);
  }

  /**
   * Get all transfers for a loan
   */
  async getLoanTransfers(loanId: string): Promise<LoanTransfer[]> {
    return await this.transferRepository.find({
      where: { loanId },
      order: { transferDate: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get all transfers for a customer
   */
  async getCustomerTransfers(
    applicantType: ApplicantType,
    applicantId: string,
  ): Promise<LoanTransfer[]> {
    return await this.transferRepository.find({
      where: [
        { oldApplicantType: applicantType, oldApplicantId: applicantId },
        { newApplicantType: applicantType, newApplicantId: applicantId },
      ],
      order: { transferDate: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get transfer by ID
   */
  async findOne(id: string): Promise<LoanTransfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: ['loan'],
    });

    if (!transfer) {
      throw new Error(`Loan transfer with ID ${id} not found`);
    }

    return transfer;
  }

  /**
   * Get all transfers with filters
   */
  async findAll(filters?: {
    fromDate?: Date;
    toDate?: Date;
    loanId?: string;
    applicantType?: ApplicantType;
    applicantId?: string;
  }): Promise<LoanTransfer[]> {
    const query = this.transferRepository.createQueryBuilder('transfer');

    if (filters?.fromDate) {
      query.andWhere('transfer.transferDate >= :fromDate', {
        fromDate: filters.fromDate,
      });
    }

    if (filters?.toDate) {
      query.andWhere('transfer.transferDate <= :toDate', {
        toDate: filters.toDate,
      });
    }

    if (filters?.loanId) {
      query.andWhere('transfer.loanId = :loanId', { loanId: filters.loanId });
    }

    if (filters?.applicantType && filters?.applicantId) {
      query.andWhere(
        '(transfer.oldApplicantType = :applicantType AND transfer.oldApplicantId = :applicantId) OR (transfer.newApplicantType = :applicantType AND transfer.newApplicantId = :applicantId)',
        {
          applicantType: filters.applicantType,
          applicantId: filters.applicantId,
        },
      );
    }

    return await query
      .orderBy('transfer.transferDate', 'DESC')
      .addOrderBy('transfer.createdAt', 'DESC')
      .getMany();
  }
}

