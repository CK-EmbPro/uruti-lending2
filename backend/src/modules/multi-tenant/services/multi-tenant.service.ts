import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant as TenantEntity } from '../entities/tenant.entity';
import { CreateTenantDto, Tenant } from '../dto/multi-tenant.dto';

@Injectable()
export class MultiTenantService {
  private readonly logger = new Logger(MultiTenantService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private tenantRepository: Repository<TenantEntity>,
  ) {}

  async createTenant(createDto: CreateTenantDto): Promise<Tenant> {
    // Check if subdomain exists
    const existing = await this.tenantRepository.findOne({
      where: [
        { subdomain: createDto.subdomain },
        ...(createDto.customDomain ? [{ customDomain: createDto.customDomain }] : []),
      ] as any,
    });

    if (existing) {
      throw new BadRequestException('Subdomain or custom domain already exists');
    }

    const tenant = this.tenantRepository.create({
      ...createDto,
      isActive: true,
    });

    return this.tenantRepository.save(tenant);
  }

  async findAllTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOneTenant(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async findTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { subdomain } });
  }

  async findTenantByDomain(domain: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { customDomain: domain } });
  }

  async updateTenant(id: string, updateData: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findOneTenant(id);
    Object.assign(tenant, updateData);
    return this.tenantRepository.save(tenant);
  }

  async getTenantStats(tenantId: string): Promise<Record<string, any>> {
    // TODO: Get actual statistics from various modules
    return {
      totalUsers: 0,
      totalLoans: 0,
      totalApplications: 0,
      activeUsers: 0,
    };
  }
}

