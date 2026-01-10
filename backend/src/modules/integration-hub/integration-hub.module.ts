import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationHubService } from './services/integration-hub.service';
import { IntegrationHubController } from './integration-hub.controller';
import { Integration } from './entities/integration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Integration])],
  controllers: [IntegrationHubController],
  providers: [IntegrationHubService],
  exports: [IntegrationHubService],
})
export class IntegrationHubModule {}

