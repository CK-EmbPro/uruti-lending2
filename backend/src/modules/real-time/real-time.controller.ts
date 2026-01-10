import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RealTimeService } from './services/real-time.service';
import { RealTimeGateway } from './real-time.gateway';
import {
  SendRealTimeMessageDto,
  BroadcastMessageDto,
} from './dto/real-time.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Real-Time')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('real-time')
export class RealTimeController {
  constructor(
    private readonly realTimeService: RealTimeService,
    private readonly realTimeGateway: RealTimeGateway,
  ) {}

  @Post('messages')
  @ApiOperation({ summary: 'Send real-time message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(@Body() sendDto: SendRealTimeMessageDto) {
    const message = await this.realTimeService.sendMessage(sendDto);

    // Emit via WebSocket
    await this.realTimeGateway.sendToUser(sendDto.recipientId, 'new_message', message);

    return message;
  }

  @Post('messages/broadcast')
  @ApiOperation({ summary: 'Broadcast message to all users' })
  @ApiResponse({ status: 200, description: 'Message broadcasted' })
  async broadcastMessage(@Body() broadcastDto: BroadcastMessageDto) {
    const count = await this.realTimeService.broadcastMessage(broadcastDto);

    // Emit via WebSocket
    await this.realTimeGateway.broadcast('broadcast_message', {
      ...broadcastDto,
      sentAt: new Date(),
    });

    return { success: true, recipients: count };
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get user messages' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  getUserMessages(
    @Request() req: any,
    @Query('limit') limit?: number,
  ) {
    return this.realTimeService.getUserMessages(req.user.id, limit);
  }

  @Post('messages/:id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  markAsRead(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.realTimeService.markAsRead(id, req.user.id);
  }

  @Get('messages/unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  getUnreadCount(@Request() req: any) {
    return this.realTimeService.getUnreadCount(req.user.id);
  }

  @Get('connections')
  @ApiOperation({ summary: 'Get active connections' })
  @ApiResponse({ status: 200, description: 'List of connections' })
  getActiveConnections(@Query('userId') userId?: string) {
    return this.realTimeService.getActiveConnections(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get real-time statistics' })
  @ApiResponse({ status: 200, description: 'Statistics' })
  getStats() {
    return this.realTimeService.getConnectionStats();
  }
}

