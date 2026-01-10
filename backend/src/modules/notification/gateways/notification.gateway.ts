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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict to your frontend domain
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate via JWT token from query or auth header
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub || payload.id;

      // Track user's socket connections
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId)!.add(client.id);

      this.logger.log(`Client ${client.id} connected for user ${client.userId}`);
      this.logger.debug(`Total connections for user ${client.userId}: ${this.userSockets.get(client.userId)!.size}`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to notification service',
        userId: client.userId,
      });
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.userSockets.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      this.logger.log(`Client ${client.id} disconnected for user ${client.userId}`);
    }
  }

  /**
   * Extract JWT token from socket handshake
   */
  private extractToken(client: Socket): string | null {
    // Try query parameter first
    const tokenFromQuery = client.handshake.query?.token as string;
    if (tokenFromQuery) {
      return tokenFromQuery;
    }

    // Try auth header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Send notification to a specific user
   */
  sendNotificationToUser(userId: string, notification: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets && userSockets.size > 0) {
      this.logger.log(`Sending notification to user ${userId} via ${userSockets.size} socket(s)`);
      userSockets.forEach((socketId) => {
        this.server.to(socketId).emit('notification', notification);
      });
      return true;
    }
    this.logger.debug(`No active sockets for user ${userId}`);
    return false;
  }

  /**
   * Send notification to multiple users
   */
  sendNotificationToUsers(userIds: string[], notification: any) {
    userIds.forEach((userId) => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcastNotification(notification: any) {
    this.server.emit('notification', notification);
  }

  /**
   * Get unread count for a user
   */
  @SubscribeMessage('get-unread-count')
  async handleGetUnreadCount(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    // This would typically fetch from database
    // For now, just acknowledge
    client.emit('unread-count', { count: 0 });
  }

  /**
   * Mark notification as read
   */
  @SubscribeMessage('mark-as-read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    // This would update the database
    // For now, just acknowledge
    client.emit('marked-as-read', { notificationId: data.notificationId });
  }

  /**
   * Subscribe to notification type
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { types?: string[] },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    if (data.types && data.types.length > 0) {
      data.types.forEach((type) => {
        client.join(`notification-type:${type}`);
      });
      this.logger.log(`User ${client.userId} subscribed to types: ${data.types.join(', ')}`);
    }

    client.emit('subscribed', { types: data.types || [] });
  }

  /**
   * Unsubscribe from notification type
   */
  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { types?: string[] },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    if (data.types && data.types.length > 0) {
      data.types.forEach((type) => {
        client.leave(`notification-type:${type}`);
      });
      this.logger.log(`User ${client.userId} unsubscribed from types: ${data.types.join(', ')}`);
    }

    client.emit('unsubscribed', { types: data.types || [] });
  }

  /**
   * Get connected users count (admin only)
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get user's active connections count
   */
  getUserConnectionsCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }
}

