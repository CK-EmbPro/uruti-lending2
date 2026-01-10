import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealTimeService } from './services/real-time.service';
import { RealTimeController } from './real-time.controller';
import { RealTimeGateway } from './real-time.gateway';
import { RealTimeConnection } from './entities/real-time-connection.entity';
import { RealTimeMessage } from './entities/real-time-message.entity';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RealTimeConnection,
      RealTimeMessage,
    ]),
    JwtModule,
      AuthModule,
],
  controllers: [RealTimeController],
  providers: [RealTimeService, RealTimeGateway],
  exports: [RealTimeService, RealTimeGateway],
})
export class RealTimeModule {}

