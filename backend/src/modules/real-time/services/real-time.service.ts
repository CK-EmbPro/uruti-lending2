import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealTimeConnection } from '../entities/real-time-connection.entity';
import { RealTimeMessage } from '../entities/real-time-message.entity';
import {
  SendRealTimeMessageDto,
  BroadcastMessageDto,
  RealTimeConnection as RealTimeConnectionDto,
  ConnectionStatus,
  MessageType,
} from '../dto/real-time.dto';

@Injectable()
export class RealTimeService {
  private readonly logger = new Logger(RealTimeService.name);
  private readonly activeConnections = new Map<string, RealTimeConnection>();

  constructor(
    @InjectRepository(RealTimeConnection)
    private connectionRepository: Repository<RealTimeConnection>,
    @InjectRepository(RealTimeMessage)
    private messageRepository: Repository<RealTimeMessage>,
  ) {}

  async registerConnection(
    userId: string,
    socketId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RealTimeConnection> {
    // Close existing connections for this user
    await this.connectionRepository.update(
      { userId, status: ConnectionStatus.CONNECTED },
      { status: ConnectionStatus.DISCONNECTED, disconnectedAt: new Date() },
    );

    const connection = this.connectionRepository.create({
      userId,
      socketId,
      status: ConnectionStatus.CONNECTED,
      userAgent,
      ipAddress,
      connectedAt: new Date(),
      lastActivityAt: new Date(),
    });

    const saved = await this.connectionRepository.save(connection);
    this.activeConnections.set(socketId, saved);

    this.logger.log(`User ${userId} connected with socket ${socketId}`);
    return saved;
  }

  async disconnectConnection(socketId: string): Promise<void> {
    const connection = this.activeConnections.get(socketId);
    if (connection) {
      connection.status = ConnectionStatus.DISCONNECTED;
      connection.disconnectedAt = new Date();
      await this.connectionRepository.save(connection);
      this.activeConnections.delete(socketId);
      this.logger.log(`User ${connection.userId} disconnected`);
    }
  }

  async updateActivity(socketId: string): Promise<void> {
    const connection = this.activeConnections.get(socketId);
    if (connection) {
      connection.lastActivityAt = new Date();
      await this.connectionRepository.save(connection);
    }
  }

  async sendMessage(sendDto: SendRealTimeMessageDto): Promise<RealTimeMessage> {
    const message = this.messageRepository.create({
      ...sendDto,
      sentAt: new Date(),
    });

    return this.messageRepository.save(message);
  }

  async broadcastMessage(broadcastDto: BroadcastMessageDto): Promise<number> {
    // Find all active connections
    const connections = await this.connectionRepository.find({
      where: { status: ConnectionStatus.CONNECTED },
    });

    const messages: RealTimeMessage[] = [];

    for (const connection of connections) {
      // Filter by roles if specified
      if (broadcastDto.targetRoles && broadcastDto.targetRoles.length > 0) {
        // TODO: Check user roles
        // For now, send to all
      }

      const message = this.messageRepository.create({
        recipientId: connection.userId,
        messageType: broadcastDto.messageType,
        title: broadcastDto.title,
        content: broadcastDto.content,
        data: broadcastDto.data,
        sentAt: new Date(),
      });

      messages.push(message);
    }

    if (messages.length > 0) {
      await this.messageRepository.save(messages);
    }

    return messages.length;
  }

  async getUserMessages(userId: string, limit: number = 50): Promise<RealTimeMessage[]> {
    return this.messageRepository.find({
      where: { recipientId: userId },
      order: { sentAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    await this.messageRepository.update(
      { id: messageId, recipientId: userId },
      { isRead: true, readAt: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepository.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async getActiveConnections(userId?: string): Promise<RealTimeConnection[]> {
    const where: any = { status: ConnectionStatus.CONNECTED };
    if (userId) where.userId = userId;

    return this.connectionRepository.find({
      where,
      order: { lastActivityAt: 'DESC' },
    });
  }

  async getConnectionStats(): Promise<Record<string, any>> {
    const totalConnections = await this.connectionRepository.count();
    const activeConnections = await this.connectionRepository.count({
      where: { status: ConnectionStatus.CONNECTED },
    });
    const totalMessages = await this.messageRepository.count();
    const unreadMessages = await this.messageRepository.count({
      where: { isRead: false },
    });

    return {
      totalConnections,
      activeConnections,
      totalMessages,
      unreadMessages,
    };
  }

  getActiveConnectionBySocketId(socketId: string): RealTimeConnection | undefined {
    return this.activeConnections.get(socketId);
  }

  getActiveConnectionByUserId(userId: string): RealTimeConnection | undefined {
    for (const connection of this.activeConnections.values()) {
      if (connection.userId === userId && connection.status === ConnectionStatus.CONNECTED) {
        return connection;
      }
    }
    return undefined;
  }
}

