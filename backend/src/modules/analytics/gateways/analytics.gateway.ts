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
import { AnalyticsService } from '../services/analytics.service';
import { GetMetricsDto } from '../dto/dashboard.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/analytics',
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalyticsGateway.name);
  private readonly connectedClients = new Map<string, { socket: Socket; userId: string; filters?: GetMetricsDto }>();

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token as string);
      const userId = payload.id || payload.sub;

      if (!userId) {
        this.logger.warn(`Client ${client.id} connected with invalid token`);
        client.disconnect();
        return;
      }

      this.connectedClients.set(client.id, { socket: client, userId });
      this.logger.log(`Client ${client.id} (User: ${userId}) connected to analytics gateway`);

      // Send initial metrics
      const filters: GetMetricsDto = {
        companyId: payload.companyId,
      };
      const metrics = await this.analyticsService.getMetrics(filters);
      client.emit('metrics', metrics);
    } catch (error) {
      this.logger.error(`Error handling connection for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client ${client.id} disconnected from analytics gateway`);
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() filters: GetMetricsDto,
  ) {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        return { error: 'Client not authenticated' };
      }

      // Update client filters
      clientData.filters = filters;

      // Send current metrics with filters
      const metrics = await this.analyticsService.getMetrics(filters);
      client.emit('metrics', metrics);

      return { success: true, message: 'Subscribed to metrics updates' };
    } catch (error) {
      this.logger.error(`Error in subscribe: ${error.message}`);
      return { error: error.message };
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      clientData.filters = undefined;
    }
    return { success: true, message: 'Unsubscribed from metrics updates' };
  }

  @SubscribeMessage('request-metrics')
  async handleRequestMetrics(
    @ConnectedSocket() client: Socket,
    @MessageBody() filters: GetMetricsDto,
  ) {
    try {
      const metrics = await this.analyticsService.getMetrics(filters);
      client.emit('metrics', metrics);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error in request-metrics: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Broadcast metrics to all connected clients
   * Called by a scheduled task or when metrics change
   */
  async broadcastMetrics(filters?: GetMetricsDto) {
    try {
      const metrics = await this.analyticsService.getMetrics(filters || {});

      // Broadcast to all clients with matching filters or no filters
      this.connectedClients.forEach((clientData, clientId) => {
        if (!clientData.filters || this.filtersMatch(clientData.filters, filters || {})) {
          clientData.socket.emit('metrics', metrics);
        }
      });

      this.logger.debug(`Broadcasted metrics to ${this.connectedClients.size} clients`);
    } catch (error) {
      this.logger.error(`Error broadcasting metrics: ${error.message}`);
    }
  }

  /**
   * Broadcast metrics to a specific user
   */
  async broadcastToUser(userId: string, filters?: GetMetricsDto) {
    try {
      const metrics = await this.analyticsService.getMetrics(filters || {});

      this.connectedClients.forEach((clientData) => {
        if (clientData.userId === userId) {
          if (!clientData.filters || this.filtersMatch(clientData.filters, filters || {})) {
            clientData.socket.emit('metrics', metrics);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error broadcasting to user ${userId}: ${error.message}`);
    }
  }

  private filtersMatch(filters1: GetMetricsDto, filters2: GetMetricsDto): boolean {
    // Simple filter matching - can be enhanced
    return (
      filters1.companyId === filters2.companyId &&
      filters1.loanProductId === filters2.loanProductId
    );
  }
}

