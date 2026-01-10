import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlternativeCreditScoringService } from './services/alternative-credit-scoring.service';
import { AlternativeCreditScoringController } from './alternative-credit-scoring.controller';
import { AlternativeCreditScore } from './entities/alternative-credit-score.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AlternativeCreditScore])],
  controllers: [AlternativeCreditScoringController],
  providers: [AlternativeCreditScoringService],
  exports: [AlternativeCreditScoringService],
})
export class AlternativeCreditScoringModule {}

