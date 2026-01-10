import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsArray } from 'class-validator';

export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
}

export enum MessageType {
  NOTIFICATION = 'NOTIFICATION',
  ALERT = 'ALERT',
  UPDATE = 'UPDATE',
  CHAT = 'CHAT',
  SYSTEM = 'SYSTEM',
}

export class SendRealTimeMessageDto {
  @ApiProperty({ description: 'Recipient user ID', example: 'user-uuid' })
  @IsString()
  recipientId: string;

  @ApiProperty({ description: 'Message type', enum: MessageType })
  @IsEnum(MessageType)
  messageType: MessageType;

  @ApiProperty({ description: 'Message title', example: 'Payment Reminder' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Message content', example: 'Your payment is due in 3 days' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Additional data', type: Object })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is urgent', example: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;
}

export class BroadcastMessageDto {
  @ApiProperty({ description: 'Message type', enum: MessageType })
  @IsEnum(MessageType)
  messageType: MessageType;

  @ApiProperty({ description: 'Message title', example: 'System Maintenance' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Message content', example: 'System will be under maintenance' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Target user roles', type: [String] })
  @IsOptional()
  @IsArray()
  targetRoles?: string[];

  @ApiPropertyOptional({ description: 'Additional data', type: Object })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class RealTimeConnection {
  @ApiProperty({ description: 'Connection ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'User ID', example: 'user-uuid' })
  userId: string;

  @ApiProperty({ description: 'Connection status', enum: ConnectionStatus })
  status: ConnectionStatus;

  @ApiProperty({ description: 'Connected at', example: '2024-01-15T00:00:00Z' })
  connectedAt: Date;

  @ApiProperty({ description: 'Last activity', example: '2024-01-15T00:00:00Z' })
  lastActivityAt: Date;
}

