import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';

export enum ChatbotRole {
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  STAFF_ASSISTANT = 'STAFF_ASSISTANT',
}

export enum MessageType {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

export class ChatMessageDto {
  @ApiProperty({ description: 'Message content', example: 'What is the status of my loan application?' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Conversation ID (for continuing conversation)', example: 'uuid' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'User context', type: Object })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class ChatResponse {
  @ApiProperty({ description: 'Response message', example: 'Your loan application is currently under review.' })
  response: string;

  @ApiProperty({ description: 'Conversation ID', example: 'uuid' })
  conversationId: string;

  @ApiProperty({ description: 'Confidence score (0-1)', example: 0.95 })
  confidence: number;

  @ApiProperty({ description: 'Suggested actions', type: [String] })
  suggestedActions: string[];

  @ApiProperty({ description: 'Related resources', type: [Object] })
  relatedResources: Array<{
    type: string;
    title: string;
    url: string;
  }>;

  @ApiProperty({ description: 'Requires human handoff', example: false })
  requiresHumanHandoff: boolean;

  @ApiProperty({ description: 'Message ID', example: 'uuid' })
  messageId: string;
}

export class ConversationHistory {
  @ApiProperty({ description: 'Conversation ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'User ID', example: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Messages', type: [Object] })
  messages: Array<{
    id: string;
    type: MessageType;
    content: string;
    timestamp: string;
    confidence?: number;
  }>;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at', example: '2024-01-15T10:30:00Z' })
  updatedAt: string;
}

export class StaffQueryDto {
  @ApiProperty({ description: 'Query', example: 'Show me all loans with DPD > 30' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Context', type: Object })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class StaffQueryResponse {
  @ApiProperty({ description: 'Response', example: 'Found 15 loans with DPD > 30 days' })
  response: string;

  @ApiProperty({ description: 'Data', type: Object })
  data: any;

  @ApiProperty({ description: 'Action taken', example: 'QUERY_LOANS' })
  action: string;

  @ApiProperty({ description: 'Confidence score (0-1)', example: 0.90 })
  confidence: number;
}

