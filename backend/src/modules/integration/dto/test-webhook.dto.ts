import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsObject, IsString } from 'class-validator';
import { WebhookEventType } from '../entities/webhook-delivery.entity';

export class TestWebhookDto {
  @ApiProperty({
    description: 'Webhook event type to test',
    enum: WebhookEventType,
    example: WebhookEventType.LOAN_STATUS_UPDATED,
  })
  @IsEnum(WebhookEventType)
  eventType: WebhookEventType;

  @ApiPropertyOptional({
    description: 'Custom payload to send (optional, will use default if not provided)',
    type: 'object',
  })
  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Custom webhook URL to test (optional, will use platform webhook URL if not provided)',
  })
  @IsString()
  @IsOptional()
  webhookUrl?: string;
}

