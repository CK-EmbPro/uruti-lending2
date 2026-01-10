import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AccountSeedService } from '../modules/accounting/services/account-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(AccountSeedService);

  try {
    console.log('🌱 Starting Chart of Accounts seed...');
    
    // Get company ID from command line args if provided
    const companyId = process.argv[2];
    const force = process.argv[3] === 'force';

    if (companyId) {
      console.log(`📊 Seeding accounts for company: ${companyId}`);
    } else {
      console.log('📊 Seeding accounts for default company...');
    }

    if (force) {
      console.log('⚠️  Force mode: Will recreate existing accounts');
    }

    await seedService.seedChartOfAccounts(companyId, force);
    
    console.log('✅ Chart of Accounts seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Chart of Accounts:', error);
    process.exit(1);
  }
}

bootstrap();

