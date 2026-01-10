import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Loan } from '../modules/loan/entities/loan.entity';
import { CustomerPortalUser } from '../modules/customer-portal/entities/customer-portal-user.entity';
import { CustomerLoanLink } from '../modules/customer-portal/entities/customer-loan-link.entity';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

interface CustomerSeedData {
  email: string;
  name: string;
  phoneNumber?: string;
  password: string;
}

// Sample customer data - can be customized
const sampleCustomers: CustomerSeedData[] = [
  { email: 'john.doe@example.com', name: 'John Doe', phoneNumber: '+1-555-0101', password: 'customer123' },
  { email: 'jane.smith@example.com', name: 'Jane Smith', phoneNumber: '+1-555-0102', password: 'customer123' },
  { email: 'robert.johnson@example.com', name: 'Robert Johnson', phoneNumber: '+1-555-0103', password: 'customer123' },
  { email: 'emily.williams@example.com', name: 'Emily Williams', phoneNumber: '+1-555-0104', password: 'customer123' },
  { email: 'michael.brown@example.com', name: 'Michael Brown', phoneNumber: '+1-555-0105', password: 'customer123' },
  { email: 'sarah.davis@example.com', name: 'Sarah Davis', phoneNumber: '+1-555-0106', password: 'customer123' },
  { email: 'david.miller@example.com', name: 'David Miller', phoneNumber: '+1-555-0107', password: 'customer123' },
  { email: 'lisa.wilson@example.com', name: 'Lisa Wilson', phoneNumber: '+1-555-0108', password: 'customer123' },
  { email: 'james.moore@example.com', name: 'James Moore', phoneNumber: '+1-555-0109', password: 'customer123' },
  { email: 'patricia.taylor@example.com', name: 'Patricia Taylor', phoneNumber: '+1-555-0110', password: 'customer123' },
];

async function seedCustomerPortal() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('SeedCustomerPortal');

  // Get DataSource
  const dataSource = app.get(DataSource);
  const loanRepo = dataSource.getRepository(Loan);
  const customerUserRepo = dataSource.getRepository(CustomerPortalUser);
  const loanLinkRepo = dataSource.getRepository(CustomerLoanLink);

  try {
    logger.log('🌱 Starting customer portal seed...');

    // Get all existing loans
    const loans = await loanRepo.find({
      relations: ['loanProduct'],
      order: { createdAt: 'DESC' },
    });

    logger.log(`📋 Found ${loans.length} existing loans`);

    if (loans.length === 0) {
      logger.warn('⚠️  No loans found. Please seed loans first.');
      process.exit(0);
    }

    // Collect unique applicant IDs from loans
    const applicantIds = new Set<string>();
    loans.forEach(loan => {
      if (loan.applicantId) {
        applicantIds.add(loan.applicantId);
      }
    });

    logger.log(`👥 Found ${applicantIds.size} unique applicant IDs`);

    let customersCreated = 0;
    let customersSkipped = 0;
    let linksCreated = 0;
    let linksSkipped = 0;

    // Create customer portal users for each unique applicant
    const applicantIdArray = Array.from(applicantIds);
    
    for (let i = 0; i < applicantIdArray.length; i++) {
      const applicantId = applicantIdArray[i];
      
      // Check if applicantId looks like an email
      const isEmail = applicantId.includes('@');
      
      // Determine email and name
      let email: string;
      let name: string;
      let phoneNumber: string | undefined;

      if (isEmail) {
        // Use applicantId as email
        email = applicantId;
        // Extract name from email or use sample data
        const emailParts = email.split('@')[0];
        name = emailParts.split('.').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ') || `Customer ${i + 1}`;
      } else {
        // Use sample customer data or generate
        const sampleIndex = i % sampleCustomers.length;
        email = sampleCustomers[sampleIndex].email.replace('@example.com', `+${i}@example.com`);
        name = sampleCustomers[sampleIndex].name;
        phoneNumber = sampleCustomers[sampleIndex].phoneNumber;
      }

      // Check if customer portal user already exists
      let customerUser = await customerUserRepo.findOne({
        where: { email },
      });

      if (customerUser) {
        logger.log(`⏭️  Customer portal user already exists: ${email}`);
        customersSkipped++;
      } else {
        // Create new customer portal user
        const hashedPassword = await bcrypt.hash('customer123', 10);
        
        customerUser = customerUserRepo.create({
          email,
          password: hashedPassword,
          name,
          phoneNumber,
          isActive: true,
          emailVerified: true, // Auto-verify for seeded users
          emailVerifiedAt: new Date(),
        });

        customerUser = await customerUserRepo.save(customerUser);
        logger.log(`✅ Created customer portal user: ${email} (${customerUser.id})`);
        customersCreated++;
      }

      // Link all loans for this applicant to the customer account
      const applicantLoans = loans.filter(loan => loan.applicantId === applicantId);
      
      for (const loan of applicantLoans) {
        // Check if link already exists
        const existingLink = await loanLinkRepo.findOne({
          where: {
            customerId: customerUser.id,
            loanId: loan.id,
          },
        });

        if (existingLink) {
          logger.log(`⏭️  Loan ${loan.loanNumber} already linked to ${email}`);
          linksSkipped++;
        } else {
          // Create link - auto-verify if email matches
          const isVerified = isEmail && loan.applicantId === email;
          
          const link = loanLinkRepo.create({
            customerId: customerUser.id,
            loanId: loan.id,
            isVerified,
            verificationMethod: isVerified ? 'EMAIL_MATCH' : 'SEED',
            verifiedAt: isVerified ? new Date() : null,
            verifiedBy: isVerified ? customerUser.id : null,
          });

          await loanLinkRepo.save(link);
          logger.log(`🔗 Linked loan ${loan.loanNumber} to ${email} (verified: ${isVerified})`);
          linksCreated++;
        }
      }
    }

    // Summary
    logger.log('\n📊 Seed Summary:');
    logger.log(`   ✅ Customers created: ${customersCreated}`);
    logger.log(`   ⏭️  Customers skipped: ${customersSkipped}`);
    logger.log(`   🔗 Links created: ${linksCreated}`);
    logger.log(`   ⏭️  Links skipped: ${linksSkipped}`);
    logger.log('\n✅ Customer portal seed completed successfully!');
    logger.log('\n📝 Login Credentials:');
    logger.log('   All customers use password: customer123');
    logger.log('   Emails are based on loan applicantIds or sample data');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding customer portal:', error);
    console.error(error);
    await app.close();
    process.exit(1);
  }
}

seedCustomerPortal();

