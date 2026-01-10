import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APIDocumentationService } from './services/api-documentation.service';
import { APIDocumentationController } from './api-documentation.controller';
import { APIDocumentation } from './entities/api-documentation.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([APIDocumentation]),
    AuthModule,
  ],
  controllers: [APIDocumentationController],
  providers: [APIDocumentationService],
  exports: [APIDocumentationService],
})
export class APIDocumentationModule {}

