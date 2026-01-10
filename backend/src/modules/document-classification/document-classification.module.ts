import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentClassificationService } from './services/document-classification.service';
import { DocumentClassificationController } from './document-classification.controller';
import { DocumentType } from '../document-type/entities/document-type.entity';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentType]),
    forwardRef(() => AIModule),
  ],
  controllers: [DocumentClassificationController],
  providers: [DocumentClassificationService],
  exports: [DocumentClassificationService],
})
export class DocumentClassificationModule {}

