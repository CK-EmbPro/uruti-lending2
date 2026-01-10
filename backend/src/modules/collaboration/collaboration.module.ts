import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaborationService } from './services/collaboration.service';
import { CollaborationController } from './collaboration.controller';
import { Comment } from './entities/comment.entity';
import { ActivityFeed } from './entities/activity-feed.entity';
import { UserPresence } from './entities/user-presence.entity';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comment,
      ActivityFeed,
      UserPresence,
      Workspace,
      WorkspaceMember,
    ]),
      AuthModule,
],
  controllers: [CollaborationController],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}

