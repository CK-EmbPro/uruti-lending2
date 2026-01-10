import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventDrivenService } from './services/event-driven.service';
import { EventDrivenController } from './event-driven.controller';
import { Event } from './entities/event.entity';
import { EventSubscription } from './entities/event-subscription.entity';
import { EventHandler } from './entities/event-handler.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventSubscription,
      EventHandler,
    ]),
      AuthModule,
],
  controllers: [EventDrivenController],
  providers: [EventDrivenService],
  exports: [EventDrivenService],
})
export class EventDrivenModule {}

