import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileProcessingService } from './services/file-processing.service';
import { FileProcessingController } from './file-processing.controller';
import { FileProcessingJob } from './entities/file-processing-job.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileProcessingJob]),
    AuthModule,
  ],
  controllers: [FileProcessingController],
  providers: [FileProcessingService],
  exports: [FileProcessingService],
})
export class FileProcessingModule {}

