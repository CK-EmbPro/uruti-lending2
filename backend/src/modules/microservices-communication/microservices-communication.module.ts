import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicroservicesCommunicationService } from './services/microservices-communication.service';
import { MicroservicesCommunicationController } from './microservices-communication.controller';
import { ServiceRegistry } from './entities/service-registry.entity';
import { ServiceCallLog } from './entities/service-call-log.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceRegistry,
      ServiceCallLog,
    ]),
      AuthModule,
],
  controllers: [MicroservicesCommunicationController],
  providers: [MicroservicesCommunicationService],
  exports: [MicroservicesCommunicationService],
})
export class MicroservicesCommunicationModule {}

