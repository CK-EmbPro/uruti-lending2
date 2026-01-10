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
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  companyId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/loan-tracker',
})
export class LoanTrackerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LoanTrackerGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private readonly loanSubscriptions = new Map<string, Set<string>>(); // loanId -> Set of socketIds
  private readonly applicationSubscriptions = new Map<string, Set<string>>(); // applicationId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub || payload.id;
      client.companyId = payload.companyId;

      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId)!.add(client.id);

      this.logger.log(`Client ${client.id} connected for user ${client.userId}`);
      
      client.emit('connected', {
        message: 'Connected to loan tracker service',
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

      // Remove from loan subscriptions
      for (const [loanId, sockets] of this.loanSubscriptions.entries()) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.loanSubscriptions.delete(loanId);
        }
      }

      // Remove from application subscriptions
      for (const [appId, sockets] of this.applicationSubscriptions.entries()) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.applicationSubscriptions.delete(appId);
        }
      }

      this.logger.log(`Client ${client.id} disconnected for user ${client.userId}`);
    }
  }

  /**
   * Subscribe to loan status updates
   */
  @SubscribeMessage('subscribe:loan')
  handleSubscribeLoan(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { loanId: string },
  ) {
    if (!client.userId || !data.loanId) {
      return { error: 'Invalid subscription request' };
    }

    if (!this.loanSubscriptions.has(data.loanId)) {
      this.loanSubscriptions.set(data.loanId, new Set());
    }
    this.loanSubscriptions.get(data.loanId)!.add(client.id);

    this.logger.log(`User ${client.userId} subscribed to loan ${data.loanId}`);
    
    return {
      success: true,
      message: `Subscribed to loan ${data.loanId}`,
      loanId: data.loanId,
    };
  }

  /**
   * Unsubscribe from loan status updates
   */
  @SubscribeMessage('unsubscribe:loan')
  handleUnsubscribeLoan(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { loanId: string },
  ) {
    if (data.loanId && this.loanSubscriptions.has(data.loanId)) {
      this.loanSubscriptions.get(data.loanId)!.delete(client.id);
      if (this.loanSubscriptions.get(data.loanId)!.size === 0) {
        this.loanSubscriptions.delete(data.loanId);
      }
    }

    return { success: true, message: `Unsubscribed from loan ${data.loanId}` };
  }

  /**
   * Subscribe to application status updates
   */
  @SubscribeMessage('subscribe:application')
  handleSubscribeApplication(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { applicationId: string },
  ) {
    if (!client.userId || !data.applicationId) {
      return { error: 'Invalid subscription request' };
    }

    if (!this.applicationSubscriptions.has(data.applicationId)) {
      this.applicationSubscriptions.set(data.applicationId, new Set());
    }
    this.applicationSubscriptions.get(data.applicationId)!.add(client.id);

    this.logger.log(`User ${client.userId} subscribed to application ${data.applicationId}`);
    
    return {
      success: true,
      message: `Subscribed to application ${data.applicationId}`,
      applicationId: data.applicationId,
    };
  }

  /**
   * Unsubscribe from application status updates
   */
  @SubscribeMessage('unsubscribe:application')
  handleUnsubscribeApplication(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { applicationId: string },
  ) {
    if (data.applicationId && this.applicationSubscriptions.has(data.applicationId)) {
      this.applicationSubscriptions.get(data.applicationId)!.delete(client.id);
      if (this.applicationSubscriptions.get(data.applicationId)!.size === 0) {
        this.applicationSubscriptions.delete(data.applicationId);
      }
    }

    return { success: true, message: `Unsubscribed from application ${data.applicationId}` };
  }

  /**
   * Broadcast loan status update
   */
  broadcastLoanUpdate(loanId: string, update: any) {
    const subscribers = this.loanSubscriptions.get(loanId);
    if (subscribers && subscribers.size > 0) {
      subscribers.forEach((socketId) => {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('loan:update', {
            loanId,
            ...update,
            timestamp: new Date().toISOString(),
          });
        }
      });
      this.logger.log(`Broadcasted loan update for ${loanId} to ${subscribers.size} subscribers`);
    }
  }

  /**
   * Broadcast application status update
   */
  broadcastApplicationUpdate(applicationId: string, update: any) {
    const subscribers = this.applicationSubscriptions.get(applicationId);
    if (subscribers && subscribers.size > 0) {
      subscribers.forEach((socketId) => {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('application:update', {
            applicationId,
            ...update,
            timestamp: new Date().toISOString(),
          });
        }
      });
      this.logger.log(`Broadcasted application update for ${applicationId} to ${subscribers.size} subscribers`);
    }
  }

  /**
   * Extract JWT token from socket handshake
   */
  private extractToken(client: Socket): string | null {
    const tokenFromQuery = client.handshake.query?.token as string;
    if (tokenFromQuery) {
      return tokenFromQuery;
    }

    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}

