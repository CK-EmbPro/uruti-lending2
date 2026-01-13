import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Company } from '../company/entities/company.entity';


@Injectable()
export class UserSeedService {
  private readonly logger = new Logger(UserSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  /**
   * Get or create a default company for seeding
   */
  private async getOrCreateDefaultCompany(): Promise<Company> {
    let company = await this.companyRepository.findOne({ where: { code: 'DEFAULT' } });
    
    if (!company) {
      this.logger.log('Creating default seed company...');
      company = this.companyRepository.create({
        name: 'Uruti Lending Default',
        code: 'DEFAULT',
        isActive: true,
      });
      company = await this.companyRepository.save(company);
    }
    
    return company;
  }


  /**
   * Seed default users for the system
   */
  async seedDefaultUsers(): Promise<void> {
    this.logger.log('Starting user seed...');

    try {
      // Check if users already exist
      const existingUsers = await this.userRepository.count();
      if (existingUsers > 0) {
        this.logger.log(
          `Found ${existingUsers} existing users. Skipping seed.`,
        );
        return;
      }

      const users = [
        {
          email: 'admin@urutilending.com',
          password: 'admin123',
          name: 'System Administrator',
          roles: ['admin', 'user'],
          isActive: true,
        },
        {
          email: 'loan.officer@urutilending.com',
          password: 'officer123',
          name: 'Loan Officer',
          roles: ['loan_officer', 'user'],
          isActive: true,
        },
        {
          email: 'manager@urutilending.com',
          password: 'manager123',
          name: 'Loan Manager',
          roles: ['manager', 'loan_officer', 'user'],
          isActive: true,
        },
        {
          email: 'approver@urutilending.com',
          password: 'approver123',
          name: 'Loan Approver',
          roles: ['approver', 'user'],
          isActive: true,
        },
        {
          email: 'user@urutilending.com',
          password: 'user123',
          name: 'Regular User',
          roles: ['user'],
          isActive: true,
        },
      ];

      const defaultCompany = await this.getOrCreateDefaultCompany();

      for (const userData of users) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const user = this.userRepository.create({
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          roles: userData.roles,
          isActive: userData.isActive,
          companyId: defaultCompany.id,
        });


        await this.userRepository.save(user);
        this.logger.log(`Created user: ${userData.email}`);
      }

      this.logger.log('Default users seeded successfully');
    } catch (error) {
      this.logger.error(`Error seeding users: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Seed users even if some already exist (for development)
   */
  async seedUsersForce(): Promise<void> {
    this.logger.log('Starting forced user seed...');

    try {
      const defaultCompany = await this.getOrCreateDefaultCompany();
      const users = [
        {
          email: 'admin@urutilending.com',
          password: 'admin123',
          name: 'System Administrator',
          roles: ['admin', 'user'],
          isActive: true,
        },
        {
          email: 'loan.officer@urutilending.com',
          password: 'officer123',
          name: 'Loan Officer',
          roles: ['loan_officer', 'user'],
          isActive: true,
        },
        {
          email: 'manager@urutilending.com',
          password: 'manager123',
          name: 'Loan Manager',
          roles: ['manager', 'loan_officer', 'user'],
          isActive: true,
        },
        {
          email: 'approver@urutilending.com',
          password: 'approver123',
          name: 'Loan Approver',
          roles: ['approver', 'user'],
          isActive: true,
        },
        {
          email: 'user@urutilending.com',
          password: 'user123',
          name: 'Regular User',
          roles: ['user'],
          isActive: true,
        },
      ];

      for (const userData of users) {
        // Check if user exists
        const existingUser = await this.userRepository.findOne({
          where: { email: userData.email },
        });

        if (existingUser) {
          if (!existingUser.companyId) {
            this.logger.log(`Updating companyId for existing user ${userData.email}`);
            existingUser.companyId = defaultCompany.id;
            await this.userRepository.save(existingUser);
          } else {
            this.logger.log(`User ${userData.email} already exists with companyId. Skipping.`);
          }
          continue;
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const user = this.userRepository.create({
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          roles: userData.roles,
          isActive: userData.isActive,
          companyId: defaultCompany.id,
        });


        await this.userRepository.save(user);
        this.logger.log(`Created user: ${userData.email}`);
      }

      this.logger.log('Users seeded successfully');
    } catch (error) {
      this.logger.error(`Error seeding users: ${error.message}`, error.stack);
      throw error;
    }
  }
}

