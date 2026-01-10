import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RateLimitingService } from './services/rate-limiting.service';
import { RateLimitingController } from './rate-limiting.controller';
import { RateLimitRuleEnhanced } from './entities/rate-limit-rule-enhanced.entity';
import { RateLimitLog } from './entities/rate-limit-log.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RateLimitRuleEnhanced,
      RateLimitLog,
    ]),
      AuthModule,
],
  controllers: [RateLimitingController],
  providers: [RateLimitingService],
  exports: [RateLimitingService],
})
export class RateLimitingModule {}

