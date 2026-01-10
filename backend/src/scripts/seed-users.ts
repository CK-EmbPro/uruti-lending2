import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserSeedService } from '../modules/auth/user-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(UserSeedService);

  try {
    console.log('🌱 Starting user seed...');
    
    // Get force flag from command line args
    const force = process.argv[2] === 'force';

    if (force) {
      console.log('⚠️  Force mode: Will create users even if some exist');
      await seedService.seedUsersForce();
    } else {
      console.log('📊 Normal mode: Will only seed if no users exist');
      await seedService.seedDefaultUsers();
    }
    
    console.log('✅ Users seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

bootstrap();

