import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanDemand, DemandStatus } from './entities/loan-demand.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { ScheduleEntryStatus } from '../loan/entities/loan-repayment-schedule.entity';

@Injectable()
export class LoanDemandService {
  constructor(
    @InjectRepository(LoanDemand)
    private readonly demandRepository: Repository<LoanDemand>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepaymentSchedule)
    private readonly scheduleRepository: Repository<LoanRepaymentSchedule>,
  ) {}

  async generate(loanId?: string, date?: string): Promise<LoanDemand[]> {
    const targetDate = date ? new Date(date) : new Date();
    const demands: LoanDemand[] = [];

    // Build query for loans
    const loanQuery = this.loanRepository.createQueryBuilder('loan');
    loanQuery.where('loan.status IN (:...statuses)', {
      statuses: [LoanStatus.DISBURSED, LoanStatus.ACTIVE],
    });

    if (loanId) {
      loanQuery.andWhere('loan.id = :loanId', { loanId });
    }

    const loans = await loanQuery.getMany();

    for (const loan of loans) {
      // Find pending schedule entries that need demands
      const schedules = await this.scheduleRepository
        .createQueryBuilder('schedule')
        .where('schedule.loanId = :loanId', { loanId: loan.id })
        .andWhere('schedule.status = :status', { status: ScheduleEntryStatus.PENDING })
        .andWhere('schedule.demandGenerated = :demandGenerated', { demandGenerated: false })
        .andWhere('schedule.paymentDate <= :targetDate', { targetDate })
        .orderBy('schedule.paymentDate', 'ASC')
        .getMany();

      for (const schedule of schedules) {
        // Check if demand already exists
        const existingDemand = await this.demandRepository.findOne({
          where: { scheduleId: schedule.id },
        });

        if (existingDemand) {
          continue; // Skip if demand already generated
        }

        // Determine demand status based on due date
        let status = DemandStatus.PENDING;
        if (schedule.paymentDate < targetDate) {
          status = DemandStatus.OVERDUE;
        }

        // Create demand
        const demand = this.demandRepository.create({
          loanId: loan.id,
          scheduleId: schedule.id,
          dueDate: schedule.paymentDate,
          principalAmount: Number(schedule.principalAmount),
          interestAmount: Number(schedule.interestAmount),
          penaltyAmount: 0, // Will be calculated if overdue
          totalAmount: Number(schedule.totalPayment),
          status,
        });

        const savedDemand = await this.demandRepository.save(demand);

        // Mark schedule as demand generated
        schedule.demandGenerated = true;
        await this.scheduleRepository.save(schedule);

        demands.push(savedDemand);
      }
    }

    return demands;
  }

  async findAll(loanId?: string, status?: string): Promise<LoanDemand[]> {
    const query = this.demandRepository.createQueryBuilder('demand');

    if (loanId) {
      query.where('demand.loanId = :loanId', { loanId });
    }
    if (status) {
      query.andWhere('demand.status = :status', { status });
    }

    return await query.orderBy('demand.dueDate', 'DESC').getMany();
  }

  async findOne(id: string): Promise<LoanDemand> {
    const demand = await this.demandRepository.findOne({ where: { id } });
    if (!demand) {
      throw new NotFoundException(`Loan demand with ID ${id} not found`);
    }
    return demand;
  }

  async findByLoanId(loanId: string): Promise<LoanDemand[]> {
    return await this.demandRepository.find({
      where: { loanId },
      order: { dueDate: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const demand = await this.findOne(id);

    // Only allow deletion if not paid
    if (demand.status === DemandStatus.PAID) {
      throw new BadRequestException('Cannot delete a paid demand');
    }

    // Reset schedule demand generated flag
    if (demand.scheduleId) {
      const schedule = await this.scheduleRepository.findOne({
        where: { id: demand.scheduleId },
      });
      if (schedule) {
        schedule.demandGenerated = false;
        await this.scheduleRepository.save(schedule);
      }
    }

    await this.demandRepository.remove(demand);
  }
}

