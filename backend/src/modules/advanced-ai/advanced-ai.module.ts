import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancedAIService } from './services/advanced-ai.service';
import { AdvancedAIController } from './advanced-ai.controller';
import { AIModel } from './entities/ai-model.entity';
import { AIPrediction } from './entities/ai-prediction.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AIModel,
      AIPrediction,
    ]),
      AuthModule,
],
  controllers: [AdvancedAIController],
  providers: [AdvancedAIService],
  exports: [AdvancedAIService],
})
export class AdvancedAIModule {}

