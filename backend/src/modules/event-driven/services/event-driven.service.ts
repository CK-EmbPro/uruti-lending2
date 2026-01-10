import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Event } from '../entities/event.entity';
import { EventSubscription } from '../entities/event-subscription.entity';
import { EventHandler } from '../entities/event-handler.entity';
import {
  PublishEventDto,
  SubscribeToEventDto,
  EventReplayDto,
  Event as EventDto,
  EventSubscription as EventSubscriptionDto,
  EventStatus,
  EventPriority,
  HandlerType,
} from '../dto/event-driven.dto';

@Injectable()
export class EventDrivenService {
  private readonly logger = new Logger(EventDrivenService.name);

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventSubscription)
    private subscriptionRepository: Repository<EventSubscription>,
    @InjectRepository(EventHandler)
    private handlerRepository: Repository<EventHandler>,
  ) {}

  async publishEvent(publishDto: PublishEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...publishDto,
      publishedAt: new Date(),
      status: EventStatus.PENDING,
      priority: publishDto.priority || EventPriority.NORMAL,
    });

    const saved = await this.eventRepository.save(event);

    // Process event asynchronously
    this.processEvent(saved.id).catch(error => {
      this.logger.error(`Error processing event ${saved.id}: ${error.message}`);
    });

    return saved;
  }

  private async processEvent(eventId: string): Promise<void> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      this.logger.error(`Event ${eventId} not found`);
      return;
    }

    event.status = EventStatus.PROCESSING;
    await this.eventRepository.save(event);

    try {
      // Find matching subscriptions
      const subscriptions = await this.subscriptionRepository.find({
        where: { isActive: true },
      });

      const matchingSubscriptions = subscriptions.filter(sub =>
        this.matchesPattern(event.eventName, sub.eventPattern),
      );

      // Execute handlers for each matching subscription
      for (const subscription of matchingSubscriptions) {
        await this.executeHandler(event, subscription);
      }

      event.status = EventStatus.COMPLETED;
      event.processedAt = new Date();
    } catch (error) {
      this.logger.error(`Error processing event ${eventId}: ${error.message}`);
      event.status = EventStatus.FAILED;
      event.errorMessage = error.message;

      // Retry if retries remaining
      if (event.retryCount < event.maxRetries) {
        event.retryCount += 1;
        event.status = EventStatus.RETRYING;
        // Schedule retry (simplified - in production, use a queue)
        setTimeout(() => this.processEvent(eventId), 5000 * event.retryCount);
      }
    } finally {
      await this.eventRepository.save(event);
    }
  }

  private matchesPattern(eventName: string, pattern: string): boolean {
    // Simple pattern matching (support * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(eventName);
  }

  private async executeHandler(event: Event, subscription: EventSubscription): Promise<void> {
    const startTime = Date.now();

    const handler = this.handlerRepository.create({
      eventId: event.id,
      subscriptionId: subscription.id,
      status: EventStatus.PROCESSING,
    });

    const savedHandler = await this.handlerRepository.save(handler);

    try {
      // Execute handler based on type
      let result: Record<string, any> = {};

      switch (subscription.handlerType) {
        case HandlerType.WEBHOOK:
          result = await this.executeWebhookHandler(subscription.handlerConfig, event);
          break;
        case HandlerType.FUNCTION:
          result = await this.executeFunctionHandler(subscription.handlerConfig, event);
          break;
        case HandlerType.QUEUE:
          result = await this.executeQueueHandler(subscription.handlerConfig, event);
          break;
        case HandlerType.EMAIL:
          result = await this.executeEmailHandler(subscription.handlerConfig, event);
          break;
        case HandlerType.SMS:
          result = await this.executeSMSHandler(subscription.handlerConfig, event);
          break;
      }

      const executionTime = Date.now() - startTime;

      savedHandler.status = EventStatus.COMPLETED;
      savedHandler.executedAt = new Date();
      savedHandler.executionTime = executionTime;
      savedHandler.result = result;

      subscription.processedCount += 1;
      subscription.lastProcessedAt = new Date();
    } catch (error) {
      this.logger.error(`Error executing handler for subscription ${subscription.id}: ${error.message}`);

      savedHandler.status = EventStatus.FAILED;
      savedHandler.executedAt = new Date();
      savedHandler.executionTime = Date.now() - startTime;
      savedHandler.errorMessage = error.message;

      subscription.failedCount += 1;
      subscription.retryCount += 1;
    } finally {
      await this.handlerRepository.save(savedHandler);
      await this.subscriptionRepository.save(subscription);
    }
  }

  private async executeWebhookHandler(
    config: Record<string, any>,
    event: Event,
  ): Promise<Record<string, any>> {
    // TODO: Make HTTP request to webhook URL
    const url = config.url;
    this.logger.log(`Executing webhook handler: ${url} for event ${event.eventName}`);
    return { success: true, url };
  }

  private async executeFunctionHandler(
    config: Record<string, any>,
    event: Event,
  ): Promise<Record<string, any>> {
    // TODO: Execute function/code
    const functionName = config.functionName;
    this.logger.log(`Executing function handler: ${functionName} for event ${event.eventName}`);
    return { success: true, functionName };
  }

  private async executeQueueHandler(
    config: Record<string, any>,
    event: Event,
  ): Promise<Record<string, any>> {
    // TODO: Publish to queue (RabbitMQ, Kafka, etc.)
    const queueName = config.queueName;
    this.logger.log(`Publishing to queue: ${queueName} for event ${event.eventName}`);
    return { success: true, queueName };
  }

  private async executeEmailHandler(
    config: Record<string, any>,
    event: Event,
  ): Promise<Record<string, any>> {
    // TODO: Send email
    const to = config.to;
    this.logger.log(`Sending email to: ${to} for event ${event.eventName}`);
    return { success: true, to };
  }

  private async executeSMSHandler(
    config: Record<string, any>,
    event: Event,
  ): Promise<Record<string, any>> {
    // TODO: Send SMS
    const to = config.to;
    this.logger.log(`Sending SMS to: ${to} for event ${event.eventName}`);
    return { success: true, to };
  }

  async subscribeToEvent(subscribeDto: SubscribeToEventDto): Promise<EventSubscription> {
    const subscription = this.subscriptionRepository.create({
      ...subscribeDto,
      isActive: subscribeDto.isActive !== undefined ? subscribeDto.isActive : true,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async findAllSubscriptions(isActive?: boolean): Promise<EventSubscription[]> {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.subscriptionRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findAllEvents(
    eventName?: string,
    status?: EventStatus,
    limit: number = 100,
  ): Promise<Event[]> {
    const where: any = {};
    if (eventName) where.eventName = eventName;
    if (status) where.status = status;

    return this.eventRepository.find({
      where,
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async replayEvents(replayDto: EventReplayDto): Promise<{ replayed: number; failed: number }> {
    const startDate = new Date(replayDto.startDate);
    const endDate = new Date(replayDto.endDate);

    const events = await this.eventRepository.find({
      where: {
        publishedAt: MoreThan(startDate) && LessThan(endDate),
      },
    });

    let replayed = 0;
    let failed = 0;

    for (const event of events) {
      if (this.matchesPattern(event.eventName, replayDto.eventPattern)) {
        try {
          // Replay event
          await this.processEvent(event.id);
          replayed++;
        } catch (error) {
          this.logger.error(`Error replaying event ${event.id}: ${error.message}`);
          failed++;
        }
      }
    }

    return { replayed, failed };
  }

  async getEventStats(): Promise<Record<string, any>> {
    const totalEvents = await this.eventRepository.count();
    const completedEvents = await this.eventRepository.count({
      where: { status: EventStatus.COMPLETED },
    });
    const failedEvents = await this.eventRepository.count({
      where: { status: EventStatus.FAILED },
    });
    const pendingEvents = await this.eventRepository.count({
      where: { status: EventStatus.PENDING },
    });

    const activeSubscriptions = await this.subscriptionRepository.count({
      where: { isActive: true },
    });

    return {
      totalEvents,
      completedEvents,
      failedEvents,
      pendingEvents,
      successRate: totalEvents > 0 ? completedEvents / totalEvents : 0,
      activeSubscriptions,
    };
  }
}

