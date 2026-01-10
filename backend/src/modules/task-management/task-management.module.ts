import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskManagementService } from './services/task-management.service';
import { TaskManagementController } from './task-management.controller';
import { Task } from './entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TaskManagementController],
  providers: [TaskManagementService],
  exports: [TaskManagementService],
})
export class TaskManagementModule {}

