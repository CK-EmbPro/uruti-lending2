import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhiteLabelService } from './services/white-label.service';
import { WhiteLabelController } from './white-label.controller';
import { WhiteLabelConfiguration } from './entities/white-label.entity';
import { RevenueShareTransaction } from './entities/revenue-share-transaction.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([WhiteLabelConfiguration, RevenueShareTransaction]),
      AuthModule,
],
  controllers: [WhiteLabelController],
  providers: [WhiteLabelService],
  exports: [WhiteLabelService],
})
export class WhiteLabelModule {}

