import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WorkflowSeedService } from '../modules/workflow/workflow-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(WorkflowSeedService);

  try {
    console.log('🌱 Starting workflow seed...');
    
    await seedService.seedDefaultWorkflows();
    
    console.log('✅ Workflows seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding workflows:', error);
    process.exit(1);
  }
}

bootstrap();
