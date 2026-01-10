import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { ActivityFeed } from '../entities/activity-feed.entity';
import { UserPresence } from '../entities/user-presence.entity';
import { ActivityType, PresenceStatus } from '../dto/collaboration.dto';
import { Workspace } from '../entities/workspace.entity';
import { WorkspaceMember, WorkspaceRole } from '../entities/workspace-member.entity';
import {
  CreateCommentDto,
  CreateWorkspaceDto,
  Comment as CommentDto,
  Activity,
  UserPresence as UserPresenceDto,
} from '../dto/collaboration.dto';

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(ActivityFeed)
    private activityRepository: Repository<ActivityFeed>,
    @InjectRepository(UserPresence)
    private presenceRepository: Repository<UserPresence>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private membershipRepository: Repository<WorkspaceMember>,
  ) {}

  async createComment(userId: string, createDto: CreateCommentDto): Promise<Comment> {
    const comment = this.commentRepository.create({
      authorId: userId,
      ...createDto,
    });

    const saved = await this.commentRepository.save(comment);

    // Update reply count if it's a reply
    if (createDto.parentCommentId) {
      const parent = await this.commentRepository.findOne({
        where: { id: createDto.parentCommentId },
      });
      if (parent) {
        parent.replyCount += 1;
        await this.commentRepository.save(parent);
      }
    }

    // Create activity
    await this.createActivity(
      userId,
      ActivityType.COMMENT,
      createDto.entityType,
      createDto.entityId,
      `Commented on ${createDto.entityType}`,
    );

    // Notify mentioned users
    if (createDto.mentionedUserIds && createDto.mentionedUserIds.length > 0) {
      for (const mentionedId of createDto.mentionedUserIds) {
        await this.createActivity(
          mentionedId,
          ActivityType.MENTION,
          createDto.entityType,
          createDto.entityId,
          `You were mentioned in a comment`,
        );
      }
    }

    return saved;
  }

  async getComments(entityType: string, entityId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: {
        entityType,
        entityId,
        parentCommentId: null, // Top-level comments only
        isDeleted: false,
      },
      order: { createdAt: 'ASC' },
      relations: ['replies'],
    });
  }

  async likeComment(userId: string, commentId: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    comment.likeCount += 1;
    return this.commentRepository.save(comment);
  }

  async createActivity(
    userId: string,
    activityType: ActivityType,
    entityType: string,
    entityId: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<ActivityFeed> {
    const activity = this.activityRepository.create({
      userId,
      activityType,
      entityType,
      entityId,
      description,
      metadata,
    });

    return this.activityRepository.save(activity);
  }

  async getActivityFeed(
    userId?: string,
    entityType?: string,
    entityId?: string,
    limit: number = 50,
  ): Promise<ActivityFeed[]> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    return this.activityRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markActivityAsRead(activityId: string): Promise<ActivityFeed> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    activity.isRead = true;
    return this.activityRepository.save(activity);
  }

  async updatePresence(
    userId: string,
    status: PresenceStatus,
    currentActivity?: string,
  ): Promise<UserPresence> {
    let presence = await this.presenceRepository.findOne({ where: { userId } });

    if (!presence) {
      presence = this.presenceRepository.create({ userId });
    }

    presence.status = status;
    presence.lastSeen = new Date();
    if (currentActivity) {
      presence.currentActivity = currentActivity;
    }

    return this.presenceRepository.save(presence);
  }

  async getPresence(userId: string): Promise<UserPresence> {
    const presence = await this.presenceRepository.findOne({ where: { userId } });
    if (!presence) {
      const newPresence = this.presenceRepository.create({
        userId,
        status: PresenceStatus.OFFLINE,
        lastSeen: new Date(),
        currentActivity: null,
        metadata: null,
      });
      return await this.presenceRepository.save(newPresence);
    }
    return presence;
  }

  async getMultiplePresence(userIds: string[]): Promise<UserPresence[]> {
    return this.presenceRepository.find({
      where: userIds.map(id => ({ userId: id })),
    });
  }

  async createWorkspace(userId: string, createDto: CreateWorkspaceDto): Promise<Workspace> {
    const workspace = this.workspaceRepository.create({
      ...createDto,
      createdBy: userId,
    });

    const saved = await this.workspaceRepository.save(workspace);

    // Add creator as admin
    await this.addWorkspaceMember(saved.id, userId, WorkspaceRole.ADMIN);

    // Add other members if provided
    if (createDto.memberIds) {
      for (const memberId of createDto.memberIds) {
        if (memberId !== userId) {
          await this.addWorkspaceMember(saved.id, memberId, WorkspaceRole.MEMBER);
        }
      }
    }

    return saved;
  }

  async addWorkspaceMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole = WorkspaceRole.MEMBER,
  ): Promise<WorkspaceMember> {
    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    const existing = await this.membershipRepository.findOne({
      where: { workspaceId, userId },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of this workspace');
    }

    const membership = this.membershipRepository.create({
      workspaceId,
      userId,
      role,
    });

    const saved = await this.membershipRepository.save(membership);

    // Update member count
    workspace.memberCount += 1;
    await this.workspaceRepository.save(workspace);

    return saved;
  }

  async getWorkspaces(userId: string): Promise<Workspace[]> {
    const memberships = await this.membershipRepository.find({
      where: { userId, isActive: true },
    });

    const workspaceIds = memberships.map(m => m.workspaceId);
    if (workspaceIds.length === 0) {
      return [];
    }

    return this.workspaceRepository.find({
      where: workspaceIds.map(id => ({ id })),
      order: { createdAt: 'DESC' },
    });
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.membershipRepository.find({
      where: { workspaceId, isActive: true },
      order: { joinedAt: 'ASC' },
    });
  }
}

