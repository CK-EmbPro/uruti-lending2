import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsArray, Min, Max } from 'class-validator';

export enum SocialPostType {
  TESTIMONIAL = 'TESTIMONIAL',
  REVIEW = 'REVIEW',
  TIP = 'TIP',
  QUESTION = 'QUESTION',
  ANSWER = 'ANSWER',
  SUCCESS_STORY = 'SUCCESS_STORY',
}

export enum PostStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

export enum ReviewRating {
  ONE_STAR = 1,
  TWO_STARS = 2,
  THREE_STARS = 3,
  FOUR_STARS = 4,
  FIVE_STARS = 5,
}

export class CreateSocialPostDto {
  @ApiProperty({ description: 'Post type', enum: SocialPostType })
  @IsEnum(SocialPostType)
  postType: SocialPostType;

  @ApiProperty({ description: 'Post title', example: 'Great experience with Uruti Lending' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Post content', example: 'I had an amazing experience...' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Loan ID (if related to loan)', example: 'uuid' })
  @IsOptional()
  @IsString()
  loanId?: string;

  @ApiPropertyOptional({ description: 'Rating (for reviews)', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is anonymous', example: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class CreateCommunityGroupDto {
  @ApiProperty({ description: 'Group name', example: 'First-Time Borrowers' })
  @IsString()
  groupName: string;

  @ApiProperty({ description: 'Group description', example: 'A community for first-time borrowers' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Is private', example: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: 'Category', example: 'Borrowing Tips' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class SocialPost {
  @ApiProperty({ description: 'Post ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Author ID', example: 'uuid' })
  authorId: string;

  @ApiProperty({ description: 'Post type', enum: SocialPostType })
  postType: SocialPostType;

  @ApiProperty({ description: 'Title' })
  title: string;

  @ApiProperty({ description: 'Content' })
  content: string;

  @ApiProperty({ description: 'Status', enum: PostStatus })
  status: PostStatus;

  @ApiProperty({ description: 'Like count', example: 25 })
  likeCount: number;

  @ApiProperty({ description: 'Comment count', example: 5 })
  commentCount: number;

  @ApiProperty({ description: 'Share count', example: 10 })
  shareCount: number;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

export class SocialLeaderboard {
  @ApiProperty({ description: 'Top referrers', type: [Object] })
  topReferrers: Array<{
    customerId: string;
    name: string;
    referralCount: number;
    totalRewards: number;
  }>;

  @ApiProperty({ description: 'Top contributors', type: [Object] })
  topContributors: Array<{
    customerId: string;
    name: string;
    postCount: number;
    helpfulVotes: number;
  }>;

  @ApiProperty({ description: 'Top investors', type: [Object] })
  topInvestors: Array<{
    investorId: string;
    name: string;
    totalInvested: number;
    totalReturns: number;
  }>;
}

