import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PermissionSeedService } from '../modules/administration/services/permission-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(PermissionSeedService);
  try {
    console.log('🌱 Starting permission seed...');
    await seedService.seedDefaultPermissions();
    console.log('✅ Permissions seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    process.exit(1);
  }
}

bootstrap();
