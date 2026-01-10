import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialPost } from '../entities/social-post.entity';
import { SocialPostType, PostStatus } from '../dto/social-lending.dto';
import { SocialPostInteraction, InteractionType } from '../entities/social-post-interaction.entity';
import { SocialPostComment } from '../entities/social-post-comment.entity';
import { CommunityGroup } from '../entities/community-group.entity';
import { GroupMembership, MembershipRole } from '../entities/group-membership.entity';
import {
  CreateSocialPostDto,
  CreateCommunityGroupDto,
  SocialPost as SocialPostDto,
  SocialLeaderboard,
} from '../dto/social-lending.dto';

@Injectable()
export class SocialLendingService {
  private readonly logger = new Logger(SocialLendingService.name);

  constructor(
    @InjectRepository(SocialPost)
    private postRepository: Repository<SocialPost>,
    @InjectRepository(SocialPostInteraction)
    private interactionRepository: Repository<SocialPostInteraction>,
    @InjectRepository(SocialPostComment)
    private commentRepository: Repository<SocialPostComment>,
    @InjectRepository(CommunityGroup)
    private groupRepository: Repository<CommunityGroup>,
    @InjectRepository(GroupMembership)
    private membershipRepository: Repository<GroupMembership>,
  ) {}

  async createPost(userId: string, createDto: CreateSocialPostDto): Promise<SocialPost> {
    const post = this.postRepository.create({
      authorId: userId,
      ...createDto,
      status: PostStatus.PENDING, // Require moderation
    });

    return this.postRepository.save(post);
  }

  async findAllPosts(
    postType?: SocialPostType,
    status?: PostStatus,
    limit: number = 50,
  ): Promise<SocialPost[]> {
    const where: any = {};
    if (postType) where.postType = postType;
    if (status) where.status = status;

    return this.postRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findOnePost(id: string): Promise<SocialPost> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['interactions', 'comments'],
    });

    if (!post) {
      throw new NotFoundException(`Social post with ID ${id} not found`);
    }

    // Increment view count
    post.viewCount += 1;
    await this.postRepository.save(post);

    return post;
  }

  async approvePost(postId: string): Promise<SocialPost> {
    const post = await this.findOnePost(postId);
    post.status = PostStatus.APPROVED;
    return this.postRepository.save(post);
  }

  async rejectPost(postId: string, reason?: string): Promise<SocialPost> {
    const post = await this.findOnePost(postId);
    post.status = PostStatus.REJECTED;
    if (reason) {
      post.metadata = { ...post.metadata, rejectionReason: reason };
    }
    return this.postRepository.save(post);
  }

  async interactWithPost(
    userId: string,
    postId: string,
    interactionType: InteractionType,
  ): Promise<SocialPostInteraction> {
    const post = await this.findOnePost(postId);

    // Check if interaction already exists
    const existing = await this.interactionRepository.findOne({
      where: { postId, userId, interactionType },
    });

    if (existing) {
      throw new BadRequestException('You have already performed this interaction');
    }

    const interaction = this.interactionRepository.create({
      postId,
      userId,
      interactionType,
    });

    await this.interactionRepository.save(interaction);

    // Update post counts
    if (interactionType === InteractionType.LIKE) {
      post.likeCount += 1;
    } else if (interactionType === InteractionType.SHARE) {
      post.shareCount += 1;
    }

    await this.postRepository.save(post);

    return interaction;
  }

  async addComment(userId: string, postId: string, content: string): Promise<SocialPostComment> {
    const post = await this.findOnePost(postId);

    const comment = this.commentRepository.create({
      postId,
      authorId: userId,
      content,
    });

    const saved = await this.commentRepository.save(comment);

    // Update comment count
    post.commentCount += 1;
    await this.postRepository.save(post);

    return saved;
  }

  async getComments(postId: string): Promise<SocialPostComment[]> {
    return this.commentRepository.find({
      where: { postId, isDeleted: false },
      order: { createdAt: 'ASC' },
    });
  }

  async createCommunityGroup(
    userId: string,
    createDto: CreateCommunityGroupDto,
  ): Promise<CommunityGroup> {
    const group = this.groupRepository.create({
      ...createDto,
      createdBy: userId,
    });

    const saved = await this.groupRepository.save(group);

    // Add creator as admin
    await this.joinGroup(userId, saved.id, MembershipRole.ADMIN);

    return saved;
  }

  async joinGroup(userId: string, groupId: string, role: MembershipRole = MembershipRole.MEMBER): Promise<GroupMembership> {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Community group with ID ${groupId} not found`);
    }

    const existing = await this.membershipRepository.findOne({
      where: { groupId, userId },
    });

    if (existing) {
      throw new BadRequestException('You are already a member of this group');
    }

    const membership = this.membershipRepository.create({
      groupId,
      userId,
      role,
    });

    const saved = await this.membershipRepository.save(membership);

    // Update member count
    group.memberCount += 1;
    await this.groupRepository.save(group);

    return saved;
  }

  async getLeaderboard(): Promise<SocialLeaderboard> {
    // TODO: Implement actual leaderboard queries
    // This is a placeholder
    return {
      topReferrers: [],
      topContributors: [],
      topInvestors: [],
    };
  }

  async getUserPosts(userId: string): Promise<SocialPost[]> {
    return this.postRepository.find({
      where: { authorId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getGroupPosts(groupId: string): Promise<SocialPost[]> {
    return this.postRepository.find({
      where: {
        metadata: { groupId },
        status: PostStatus.APPROVED,
      },
      order: { createdAt: 'DESC' },
    });
  }
}

