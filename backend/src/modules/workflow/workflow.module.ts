import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Workflow } from './entities/workflow.entity';
import { WorkflowState } from './entities/workflow-state.entity';
import { WorkflowTransition } from './entities/workflow-transition.entity';
import { WorkflowAction } from './entities/workflow-action.entity';
import { WorkflowService } from './workflow.service';
import { WorkflowIntegrationService } from './workflow-integration.service';
import { WorkflowSeedService } from './workflow-seed.service';
import { WorkflowAutomationService } from './services/workflow-automation.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowTrigger } from './entities/workflow-trigger.entity';
import { WorkflowExecution } from './entities/workflow-execution.entity';

@Module({
  imports: [
    ScheduleModule,
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowState,
      WorkflowTransition,
      WorkflowAction,
      WorkflowTrigger,
      WorkflowExecution,
    ]),
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowIntegrationService, WorkflowSeedService, WorkflowAutomationService],
  exports: [WorkflowService, WorkflowIntegrationService, WorkflowSeedService, WorkflowAutomationService],
})
export class WorkflowModule {}

