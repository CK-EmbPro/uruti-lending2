import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiGatewayService } from './services/api-gateway.service';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiRoute } from './entities/api-route.entity';
import { RateLimitRule } from './entities/rate-limit-rule.entity';
import { ApiRequestLog } from './entities/api-request-log.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApiRoute,
      RateLimitRule,
      ApiRequestLog,
    ]),
      AuthModule,
],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
  exports: [ApiGatewayService],
})
export class ApiGatewayModule {}

