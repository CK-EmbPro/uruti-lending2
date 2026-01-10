import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventDrivenService } from './services/event-driven.service';
import {
  PublishEventDto,
  SubscribeToEventDto,
  EventReplayDto,
  EventStatus,
} from './dto/event-driven.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Event-Driven Architecture')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('event-driven')
export class EventDrivenController {
  constructor(private readonly eventDrivenService: EventDrivenService) {}

  @Post('events/publish')
  @ApiOperation({ summary: 'Publish event' })
  @ApiResponse({ status: 201, description: 'Event published successfully' })
  publishEvent(@Body() publishDto: PublishEventDto) {
    return this.eventDrivenService.publishEvent(publishDto);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'List of events' })
  findAllEvents(
    @Query('eventName') eventName?: string,
    @Query('status') status?: EventStatus,
    @Query('limit') limit?: number,
  ) {
    return this.eventDrivenService.findAllEvents(eventName, status, limit);
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Subscribe to events' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  subscribeToEvent(@Body() subscribeDto: SubscribeToEventDto) {
    return this.eventDrivenService.subscribeToEvent(subscribeDto);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  findAllSubscriptions(@Query('isActive') isActive?: boolean) {
    return this.eventDrivenService.findAllSubscriptions(
      isActive !== undefined ? isActive === true : undefined,
    );
  }

  @Post('events/replay')
  @ApiOperation({ summary: 'Replay events' })
  @ApiResponse({ status: 200, description: 'Events replayed' })
  replayEvents(@Body() replayDto: EventReplayDto) {
    return this.eventDrivenService.replayEvents(replayDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get event statistics' })
  @ApiResponse({ status: 200, description: 'Event statistics' })
  getEventStats() {
    return this.eventDrivenService.getEventStats();
  }
}

