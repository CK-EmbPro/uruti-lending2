import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    // Check if company with same name exists
    const existingByName = await this.companyRepository.findOne({
      where: { name: createCompanyDto.name },
    });

    if (existingByName) {
      throw new ConflictException(`Company with name "${createCompanyDto.name}" already exists`);
    }

    // Check if company with same code exists
    if (createCompanyDto.code) {
      const existingByCode = await this.companyRepository.findOne({
        where: { code: createCompanyDto.code },
      });

      if (existingByCode) {
        throw new ConflictException(`Company with code "${createCompanyDto.code}" already exists`);
      }
    }

    const company = this.companyRepository.create(createCompanyDto);
    return await this.companyRepository.save(company);
  }

  async findAll(): Promise<Company[]> {
    return await this.companyRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async findByCode(code: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { code } });
    if (!company) {
      throw new NotFoundException(`Company with code ${code} not found`);
    }
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);

    // Check for name conflicts
    if (updateCompanyDto.name && updateCompanyDto.name !== company.name) {
      const existing = await this.companyRepository.findOne({
        where: { name: updateCompanyDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Company with name "${updateCompanyDto.name}" already exists`);
      }
    }

    // Check for code conflicts
    if (updateCompanyDto.code && updateCompanyDto.code !== company.code) {
      const existing = await this.companyRepository.findOne({
        where: { code: updateCompanyDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Company with code "${updateCompanyDto.code}" already exists`);
      }
    }

    Object.assign(company, updateCompanyDto);
    return await this.companyRepository.save(company);
  }

  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);
    
    // TODO: Check if company has associated loans before deletion
    // For now, we'll allow deletion but this should be checked
    // const loansCount = await this.loanRepository.count({ where: { companyId: id } });
    // if (loansCount > 0) {
    //   throw new BadRequestException('Cannot delete company with associated loans');
    // }

    await this.companyRepository.remove(company);
  }
}

