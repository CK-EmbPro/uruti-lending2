import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanInterestAccrual } from './entities/loan-interest-accrual.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { CalculationService } from '../calculation/calculation.service';
import { DateUtils } from '../../common/utils/date.utils';

@Injectable()
export class LoanInterestAccrualService {
  constructor(
    @InjectRepository(LoanInterestAccrual)
    private readonly accrualRepository: Repository<LoanInterestAccrual>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly calculationService: CalculationService,
  ) {}

  async accrue(date?: string, loanId?: string): Promise<LoanInterestAccrual[]> {
    const accrualDate = date ? new Date(date) : new Date();
    const accruals: LoanInterestAccrual[] = [];

    // Build query for loans to accrue
    const query = this.loanRepository.createQueryBuilder('loan');
    query.where('loan.status IN (:...statuses)', {
      statuses: [LoanStatus.DISBURSED, LoanStatus.ACTIVE],
    });

    if (loanId) {
      query.andWhere('loan.id = :loanId', { loanId });
    }

    const loans = await query.getMany();

    for (const loan of loans) {
      // Get last accrual date for this loan
      const lastAccrual = await this.accrualRepository.findOne({
        where: { loanId: loan.id },
        order: { postingDate: 'DESC' },
      });

      const fromDate = lastAccrual
        ? new Date(lastAccrual.postingDate)
        : loan.disbursementDate || loan.postingDate;

      // Calculate days
      const days = DateUtils.daysBetween(fromDate, accrualDate);

      if (days <= 0) {
        continue; // Skip if no days to accrue
      }

      // Calculate outstanding principal
      const outstandingPrincipal =
        Number(loan.loanAmount) -
        Number(loan.disbursedAmount) +
        Number(loan.totalPrincipalPaid);

      if (outstandingPrincipal <= 0) {
        continue; // Skip if fully paid
      }

      // Calculate interest
      const interest = this.calculationService.calculateInterest(
        outstandingPrincipal,
        Number(loan.rateOfInterest),
        days,
        'Actual/365',
        accrualDate,
      );

      // Create accrual record
      const accrual = this.accrualRepository.create({
        loanId: loan.id,
        postingDate: accrualDate,
        principalAmount: outstandingPrincipal,
        rateOfInterest: Number(loan.rateOfInterest),
        interestAmount: interest,
        days,
        dayCountConvention: 'Actual/365',
      });

      const savedAccrual = await this.accrualRepository.save(accrual);
      accruals.push(savedAccrual);
    }

    return accruals;
  }

  async findAll(loanId?: string, fromDate?: string, toDate?: string): Promise<LoanInterestAccrual[]> {
    const query = this.accrualRepository.createQueryBuilder('accrual');

    if (loanId) {
      query.where('accrual.loanId = :loanId', { loanId });
    }
    if (fromDate) {
      query.andWhere('accrual.postingDate >= :fromDate', { fromDate });
    }
    if (toDate) {
      query.andWhere('accrual.postingDate <= :toDate', { toDate });
    }

    return await query.orderBy('accrual.postingDate', 'DESC').getMany();
  }

  async findOne(id: string): Promise<LoanInterestAccrual> {
    const accrual = await this.accrualRepository.findOne({ where: { id } });
    if (!accrual) {
      throw new NotFoundException(`Interest accrual with ID ${id} not found`);
    }
    return accrual;
  }

  async findByLoanId(loanId: string): Promise<LoanInterestAccrual[]> {
    return await this.accrualRepository.find({
      where: { loanId },
      order: { postingDate: 'DESC' },
    });
  }
}

