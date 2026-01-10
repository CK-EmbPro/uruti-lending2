import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WorkflowAutomationService } from './services/workflow-automation.service';
import { WorkflowAutomationController } from './workflow-automation.controller';
import { WorkflowTrigger } from './entities/workflow-trigger.entity';
import { WorkflowExecution } from './entities/workflow-execution.entity';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [
    ScheduleModule,
    TypeOrmModule.forFeature([WorkflowTrigger, WorkflowExecution]),
    forwardRef(() => WorkflowModule),
  ],
  controllers: [WorkflowAutomationController],
  providers: [WorkflowAutomationService],
  exports: [WorkflowAutomationService],
})
export class WorkflowAutomationModule {}

