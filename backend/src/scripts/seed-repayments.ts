import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LoanRepaymentSeedService } from '../modules/loan-repayment/loan-repayment-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(LoanRepaymentSeedService);

  try {
    console.log('🌱 Starting repayment seed...');
    await seedService.seedRepayments();
    
    // Also create repayments for loans that don't have any yet
    console.log('🔗 Creating repayments for loans without repayments...');
    await seedService.createRepaymentsForLoansWithoutRepayments();
    
    console.log('✅ Repayment seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding repayments:', error);
    process.exit(1);
  }
}

bootstrap();

