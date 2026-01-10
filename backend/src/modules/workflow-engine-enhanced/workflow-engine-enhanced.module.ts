import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowEngineEnhancedService } from './services/workflow-engine-enhanced.service';
import { WorkflowEngineEnhancedController } from './workflow-engine-enhanced.controller';
import { WorkflowEnhanced } from './entities/workflow-enhanced.entity';
import { WorkflowExecutionEnhanced } from './entities/workflow-execution-enhanced.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowEnhanced,
      WorkflowExecutionEnhanced,
    ]),
      AuthModule,
],
  controllers: [WorkflowEngineEnhancedController],
  providers: [WorkflowEngineEnhancedService],
  exports: [WorkflowEngineEnhancedService],
})
export class WorkflowEngineEnhancedModule {}

