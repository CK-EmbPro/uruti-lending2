import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancedCachingService } from './services/advanced-caching.service';
import { AdvancedCachingController } from './advanced-caching.controller';
import { CacheEntry } from './entities/cache-entry.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CacheEntry]),
    AuthModule,
  ],
  controllers: [AdvancedCachingController],
  providers: [AdvancedCachingService],
  exports: [AdvancedCachingService],
})
export class AdvancedCachingModule {}
