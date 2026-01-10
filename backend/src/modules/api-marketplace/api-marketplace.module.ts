import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APIMarketplaceService } from './services/api-marketplace.service';
import { APIMarketplaceController } from './api-marketplace.controller';
import { APIKey } from './entities/api-key.entity';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';

@Module({
  imports: [TypeOrmModule.forFeature([APIKey, Webhook, WebhookDelivery])],
  controllers: [APIMarketplaceController],
  providers: [APIMarketplaceService],
  exports: [APIMarketplaceService],
})
export class APIMarketplaceModule {}

