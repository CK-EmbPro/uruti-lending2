import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanSecurity } from './entities/loan-security.entity';
import { Loan } from '../loan/entities/loan.entity';
import { CreateLoanSecurityDto } from './dto/create-loan-security.dto';
import { UpdateLoanSecurityDto } from './dto/update-loan-security.dto';

@Injectable()
export class LoanSecurityService {
  constructor(
    @InjectRepository(LoanSecurity)
    private readonly securityRepository: Repository<LoanSecurity>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  async create(createDto: CreateLoanSecurityDto): Promise<LoanSecurity> {
    // Validate loan exists
    const loan = await this.loanRepository.findOne({
      where: { id: createDto.loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
    }

    const security = this.securityRepository.create({
      ...createDto,
      pledgedDate: new Date(createDto.pledgedDate),
    });

    return await this.securityRepository.save(security);
  }

  async findAll(loanId?: string): Promise<LoanSecurity[]> {
    if (loanId) {
      return await this.securityRepository.find({
        where: { loanId },
        order: { createdAt: 'DESC' },
      });
    }
    return await this.securityRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LoanSecurity> {
    const security = await this.securityRepository.findOne({ where: { id } });
    if (!security) {
      throw new NotFoundException(`Loan security with ID ${id} not found`);
    }
    return security;
  }

  async findByLoanId(loanId: string): Promise<LoanSecurity[]> {
    return await this.securityRepository.find({
      where: { loanId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateDto: UpdateLoanSecurityDto): Promise<LoanSecurity> {
    const security = await this.findOne(id);

    if (updateDto.pledgedDate) {
      security.pledgedDate = new Date(updateDto.pledgedDate);
    }

    Object.assign(security, {
      ...updateDto,
      pledgedDate: updateDto.pledgedDate ? new Date(updateDto.pledgedDate) : security.pledgedDate,
    });

    return await this.securityRepository.save(security);
  }

  async remove(id: string): Promise<void> {
    const security = await this.findOne(id);
    await this.securityRepository.remove(security);
  }
}

