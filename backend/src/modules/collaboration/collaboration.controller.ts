import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CollaborationService } from './services/collaboration.service';
import {
  CreateCommentDto,
  CreateWorkspaceDto,
  PresenceStatus,
} from './dto/collaboration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Post('comments')
  @ApiOperation({ summary: 'Create comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  createComment(@Request() req: any, @Body() createDto: CreateCommentDto) {
    return this.collaborationService.createComment(req.user.id, createDto);
  }

  @Get('comments')
  @ApiOperation({ summary: 'Get comments' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  getComments(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.collaborationService.getComments(entityType, entityId);
  }

  @Post('comments/:id/like')
  @ApiOperation({ summary: 'Like comment' })
  @ApiResponse({ status: 200, description: 'Comment liked' })
  likeComment(@Request() req: any, @Param('id') id: string) {
    return this.collaborationService.likeComment(req.user.id, id);
  }

  @Get('activity-feed')
  @ApiOperation({ summary: 'Get activity feed' })
  @ApiResponse({ status: 200, description: 'Activity feed' })
  getActivityFeed(
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.collaborationService.getActivityFeed(userId, entityType, entityId, limit);
  }

  @Patch('activity-feed/:id/read')
  @ApiOperation({ summary: 'Mark activity as read' })
  @ApiResponse({ status: 200, description: 'Activity marked as read' })
  markActivityAsRead(@Param('id') id: string) {
    return this.collaborationService.markActivityAsRead(id);
  }

  @Patch('presence')
  @ApiOperation({ summary: 'Update user presence' })
  @ApiResponse({ status: 200, description: 'Presence updated' })
  updatePresence(
    @Request() req: any,
    @Body('status') status: PresenceStatus,
    @Body('currentActivity') currentActivity?: string,
  ) {
    return this.collaborationService.updatePresence(req.user.id, status, currentActivity);
  }

  @Get('presence/:userId')
  @ApiOperation({ summary: 'Get user presence' })
  @ApiResponse({ status: 200, description: 'User presence' })
  getPresence(@Param('userId') userId: string) {
    return this.collaborationService.getPresence(userId);
  }

  @Post('presence/batch')
  @ApiOperation({ summary: 'Get multiple user presence' })
  @ApiResponse({ status: 200, description: 'List of user presence' })
  getMultiplePresence(@Body('userIds') userIds: string[]) {
    return this.collaborationService.getMultiplePresence(userIds);
  }

  @Post('workspaces')
  @ApiOperation({ summary: 'Create workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  createWorkspace(@Request() req: any, @Body() createDto: CreateWorkspaceDto) {
    return this.collaborationService.createWorkspace(req.user.id, createDto);
  }

  @Get('workspaces')
  @ApiOperation({ summary: 'Get user workspaces' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  getWorkspaces(@Request() req: any) {
    return this.collaborationService.getWorkspaces(req.user.id);
  }

  @Post('workspaces/:id/members')
  @ApiOperation({ summary: 'Add workspace member' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  addWorkspaceMember(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.collaborationService.addWorkspaceMember(id, userId);
  }

  @Get('workspaces/:id/members')
  @ApiOperation({ summary: 'Get workspace members' })
  @ApiResponse({ status: 200, description: 'List of workspace members' })
  getWorkspaceMembers(@Param('id') id: string) {
    return this.collaborationService.getWorkspaceMembers(id);
  }
}

