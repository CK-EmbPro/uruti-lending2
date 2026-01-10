import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { RealTimeService } from './services/real-time.service';
import { SendRealTimeMessageDto } from './dto/real-time.dto';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/realtime',
})
export class RealTimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealTimeGateway.name);

  constructor(
    private readonly realTimeService: RealTimeService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify token and extract user ID
      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.id;

      if (!userId) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Register connection
      const connection = await this.realTimeService.registerConnection(
        userId,
        client.id,
        client.handshake.headers['user-agent'],
        client.handshake.address,
      );

      // Join user-specific room
      client.join(`user:${userId}`);

      // Send connection confirmation
      client.emit('connected', {
        connectionId: connection.id,
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    await this.realTimeService.disconnectConnection(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket) {
    await this.realTimeService.updateActivity(client.id);
    client.emit('pong', { timestamp: new Date() });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendRealTimeMessageDto,
  ) {
    const message = await this.realTimeService.sendMessage(data);

    // Emit to recipient
    this.server.to(`user:${data.recipientId}`).emit('new_message', message);

    return { success: true, messageId: message.id };
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const connection = this.realTimeService.getActiveConnectionBySocketId(client.id);
    if (connection) {
      await this.realTimeService.markAsRead(data.messageId, connection.userId);
      return { success: true };
    }
    return { success: false, error: 'Connection not found' };
  }

  // Method to send message to specific user (called from service)
  async sendToUser(userId: string, event: string, data: any): Promise<void> {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Method to broadcast to all connected clients
  async broadcast(event: string, data: any): Promise<void> {
    this.server.emit(event, data);
  }

  // Method to broadcast to specific room
  async broadcastToRoom(room: string, event: string, data: any): Promise<void> {
    this.server.to(room).emit(event, data);
  }
}

