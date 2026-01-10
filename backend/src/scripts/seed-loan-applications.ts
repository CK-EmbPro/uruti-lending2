import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LoanApplicationSeedService } from '../modules/loan-application/loan-application-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(LoanApplicationSeedService);

  try {
    console.log('🌱 Starting loan application seed...');
    await seedService.seedLoanApplications();
    
    // Also create loans for any existing approved applications that don't have loans
    console.log('🔗 Creating loans for approved applications without loans...');
    await seedService.createLoansForApprovedApplications();
    
    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding loan applications:', error);
    process.exit(1);
  }
}

bootstrap();

