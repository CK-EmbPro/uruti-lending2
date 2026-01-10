import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsUUID } from 'class-validator';
import { ConversationContext } from '../entities/chatbot-conversation.entity';
import { MessageType } from '../entities/chatbot-message.entity';

export class SendMessageDto {
  @ApiProperty({ description: 'Message content from user' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Conversation ID (for continuing conversation)' })
  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Conversation context', enum: ConversationContext })
  @IsEnum(ConversationContext)
  @IsOptional()
  context?: ConversationContext;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ChatbotResponseDto {
  @ApiProperty({ description: 'Response message from chatbot' })
  message: string;

  @ApiProperty({ description: 'Conversation ID' })
  conversationId: string;

  @ApiProperty({ description: 'Message ID' })
  messageId: string;

  @ApiPropertyOptional({ description: 'Suggested quick replies' })
  quickReplies?: string[];

  @ApiPropertyOptional({ description: 'Response type', enum: MessageType })
  type?: MessageType;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Confidence score' })
  confidence?: number;

  @ApiPropertyOptional({ description: 'System data retrieved' })
  systemData?: Record<string, any>;
}

export class GetConversationDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsUUID()
  conversationId: string;
}

export class UpdateConversationDto {
  @ApiPropertyOptional({ description: 'Conversation title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Conversation context', enum: ConversationContext })
  @IsEnum(ConversationContext)
  @IsOptional()
  context?: ConversationContext;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

