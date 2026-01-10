import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialLendingService } from './services/social-lending.service';
import { SocialLendingController } from './social-lending.controller';
import { SocialPost } from './entities/social-post.entity';
import { SocialPostInteraction } from './entities/social-post-interaction.entity';
import { SocialPostComment } from './entities/social-post-comment.entity';
import { CommunityGroup } from './entities/community-group.entity';
import { GroupMembership } from './entities/group-membership.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocialPost,
      SocialPostInteraction,
      SocialPostComment,
      CommunityGroup,
      GroupMembership,
    ]),
      AuthModule,
],
  controllers: [SocialLendingController],
  providers: [SocialLendingService],
  exports: [SocialLendingService],
})
export class SocialLendingModule {}

