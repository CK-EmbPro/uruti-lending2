import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancedDocumentManagementService } from './services/advanced-document-management.service';
import { AdvancedDocumentManagementController } from './advanced-document-management.controller';
import { DocumentMetadata } from './entities/document-metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentMetadata])],
  controllers: [AdvancedDocumentManagementController],
  providers: [AdvancedDocumentManagementService],
  exports: [AdvancedDocumentManagementService],
})
export class AdvancedDocumentManagementModule {}

