import { Module } from '@nestjs/common';
import { ElasticsearchService } from './services/elasticsearch.service';
import { ElasticsearchController } from './elasticsearch.controller';

import { AuthModule } from '../auth/auth.module';
@Module({
  controllers: [ElasticsearchController],
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}

