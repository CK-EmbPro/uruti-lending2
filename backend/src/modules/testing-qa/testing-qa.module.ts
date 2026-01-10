import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingQAService } from './services/testing-qa.service';
import { TestingQAController } from './testing-qa.controller';
import { TestSuite } from './entities/test-suite.entity';
import { TestResult } from './entities/test-result.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      TestSuite,
      TestResult,
    ]),
      AuthModule,
],
  controllers: [TestingQAController],
  providers: [TestingQAService],
  exports: [TestingQAService],
})
export class TestingQAModule {}

