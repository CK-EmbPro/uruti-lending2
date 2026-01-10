import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SocialLendingService } from './services/social-lending.service';
import {
  CreateSocialPostDto,
  CreateCommunityGroupDto,
  SocialPostType,
  PostStatus,
} from './dto/social-lending.dto';
import { InteractionType } from './entities/social-post-interaction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Social Lending')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('social-lending')
export class SocialLendingController {
  constructor(private readonly socialLendingService: SocialLendingService) {}

  @Post('posts')
  @ApiOperation({ summary: 'Create social post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  createPost(
    @Request() req: any,
    @Body() createDto: CreateSocialPostDto,
  ) {
    return this.socialLendingService.createPost(req.user.id, createDto);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Get all social posts' })
  @ApiResponse({ status: 200, description: 'List of social posts' })
  findAllPosts(
    @Query('postType') postType?: SocialPostType,
    @Query('status') status?: PostStatus,
    @Query('limit') limit?: number,
  ) {
    return this.socialLendingService.findAllPosts(postType, status, limit);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get social post by ID' })
  @ApiResponse({ status: 200, description: 'Social post details' })
  findOnePost(@Param('id') id: string) {
    return this.socialLendingService.findOnePost(id);
  }

  @Patch('posts/:id/approve')
  @ApiOperation({ summary: 'Approve social post' })
  @ApiResponse({ status: 200, description: 'Post approved' })
  approvePost(@Param('id') id: string) {
    return this.socialLendingService.approvePost(id);
  }

  @Patch('posts/:id/reject')
  @ApiOperation({ summary: 'Reject social post' })
  @ApiResponse({ status: 200, description: 'Post rejected' })
  rejectPost(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.socialLendingService.rejectPost(id, reason);
  }

  @Post('posts/:id/interact')
  @ApiOperation({ summary: 'Interact with post (like, share, etc.)' })
  @ApiResponse({ status: 201, description: 'Interaction created' })
  interactWithPost(
    @Request() req: any,
    @Param('id') id: string,
    @Body('interactionType') interactionType: InteractionType,
  ) {
    return this.socialLendingService.interactWithPost(req.user.id, id, interactionType);
  }

  @Post('posts/:id/comments')
  @ApiOperation({ summary: 'Add comment to post' })
  @ApiResponse({ status: 201, description: 'Comment added' })
  addComment(
    @Request() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.socialLendingService.addComment(req.user.id, id, content);
  }

  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'Get post comments' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  getComments(@Param('id') id: string) {
    return this.socialLendingService.getComments(id);
  }

  @Get('users/:userId/posts')
  @ApiOperation({ summary: 'Get user posts' })
  @ApiResponse({ status: 200, description: 'List of user posts' })
  getUserPosts(@Param('userId') userId: string) {
    return this.socialLendingService.getUserPosts(userId);
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create community group' })
  @ApiResponse({ status: 201, description: 'Group created successfully' })
  createGroup(
    @Request() req: any,
    @Body() createDto: CreateCommunityGroupDto,
  ) {
    return this.socialLendingService.createCommunityGroup(req.user.id, createDto);
  }

  @Post('groups/:id/join')
  @ApiOperation({ summary: 'Join community group' })
  @ApiResponse({ status: 201, description: 'Joined group successfully' })
  joinGroup(@Request() req: any, @Param('id') id: string) {
    return this.socialLendingService.joinGroup(req.user.id, id);
  }

  @Get('groups/:id/posts')
  @ApiOperation({ summary: 'Get group posts' })
  @ApiResponse({ status: 200, description: 'List of group posts' })
  getGroupPosts(@Param('id') id: string) {
    return this.socialLendingService.getGroupPosts(id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get social leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard data' })
  getLeaderboard() {
    return this.socialLendingService.getLeaderboard();
  }
}

