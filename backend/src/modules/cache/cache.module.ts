import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST') || 'localhost';
        const redisPort = configService.get('REDIS_PORT') || 6379;
        const redisPassword = configService.get('REDIS_PASSWORD');

        // Try to use Redis if available, otherwise use memory cache
        try {
          return {
            store: redisStore,
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            ttl: 300, // 5 minutes default
          };
        } catch (error) {
          // Fallback to memory cache
          return {
            ttl: 300,
            max: 100,
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class AppCacheModule {}

