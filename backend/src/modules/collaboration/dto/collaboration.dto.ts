import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsArray } from 'class-validator';

export enum ActivityType {
  COMMENT = 'COMMENT',
  MENTION = 'MENTION',
  ASSIGNMENT = 'ASSIGNMENT',
  STATUS_CHANGE = 'STATUS_CHANGE',
  FILE_SHARE = 'FILE_SHARE',
  UPDATE = 'UPDATE',
}

export enum PresenceStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
}

export enum WorkspaceType {
  LOAN = 'LOAN',
  APPLICATION = 'APPLICATION',
  CUSTOMER = 'CUSTOMER',
  PROJECT = 'PROJECT',
}

export class CreateCommentDto {
  @ApiProperty({ description: 'Entity type', example: 'LOAN' })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'Entity ID', example: 'uuid' })
  @IsString()
  entityId: string;

  @ApiProperty({ description: 'Comment content', example: 'This looks good!' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Parent comment ID (for replies)', example: 'uuid' })
  @IsOptional()
  @IsString()
  parentCommentId?: string;

  @ApiPropertyOptional({ description: 'Mentioned user IDs', type: [String] })
  @IsOptional()
  @IsArray()
  mentionedUserIds?: string[];
}

export class CreateWorkspaceDto {
  @ApiProperty({ description: 'Workspace name', example: 'Loan Review Team' })
  @IsString()
  workspaceName: string;

  @ApiProperty({ description: 'Workspace type', enum: WorkspaceType })
  @IsEnum(WorkspaceType)
  workspaceType: WorkspaceType;

  @ApiProperty({ description: 'Entity ID', example: 'uuid' })
  @IsString()
  entityId: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Workspace for loan review' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Member user IDs', type: [String] })
  @IsOptional()
  @IsArray()
  memberIds?: string[];
}

export class Comment {
  @ApiProperty({ description: 'Comment ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Author ID', example: 'uuid' })
  authorId: string;

  @ApiProperty({ description: 'Content' })
  content: string;

  @ApiProperty({ description: 'Entity type' })
  entityType: string;

  @ApiProperty({ description: 'Entity ID' })
  entityId: string;

  @ApiProperty({ description: 'Like count', example: 5 })
  likeCount: number;

  @ApiProperty({ description: 'Reply count', example: 2 })
  replyCount: number;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

export class Activity {
  @ApiProperty({ description: 'Activity ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'User ID', example: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Activity type', enum: ActivityType })
  activityType: ActivityType;

  @ApiProperty({ description: 'Entity type' })
  entityType: string;

  @ApiProperty({ description: 'Entity ID' })
  entityId: string;

  @ApiProperty({ description: 'Description', example: 'John commented on Loan LN-001' })
  description: string;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

export class UserPresence {
  @ApiProperty({ description: 'User ID', example: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Status', enum: PresenceStatus })
  status: PresenceStatus;

  @ApiProperty({ description: 'Last seen', example: '2024-01-15T00:00:00Z' })
  lastSeen: Date;

  @ApiProperty({ description: 'Current activity', example: 'Reviewing loan application' })
  currentActivity?: string;
}

