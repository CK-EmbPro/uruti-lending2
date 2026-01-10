import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceOptimizationService } from './services/performance-optimization.service';
import { PerformanceOptimizationController } from './performance-optimization.controller';
import { PerformanceProfile } from './entities/performance-profile.entity';
import { OptimizationRecommendation } from './entities/optimization-recommendation.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerformanceProfile,
      OptimizationRecommendation,
    ]),
      AuthModule,
],
  controllers: [PerformanceOptimizationController],
  providers: [PerformanceOptimizationService],
  exports: [PerformanceOptimizationService],
})
export class PerformanceOptimizationModule {}

