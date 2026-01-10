import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowExceptionController } from './workflow-exception.controller';
import { WorkflowExceptionService } from './services/workflow-exception.service';
import { Task } from './entities/task.entity';
import { SLATracking } from './entities/sla-tracking.entity';
import { BulkOperation } from './entities/bulk-operation.entity';
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, SLATracking, BulkOperation, Loan]),
  ],
  controllers: [WorkflowExceptionController],
  providers: [WorkflowExceptionService],
  exports: [WorkflowExceptionService],
})
export class WorkflowExceptionModule {}

