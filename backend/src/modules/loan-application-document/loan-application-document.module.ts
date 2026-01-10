import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanApplicationDocumentService } from './loan-application-document.service';
import { LoanApplicationDocumentController } from './loan-application-document.controller';
import { LoanApplicationDocument } from './entities/loan-application-document.entity';
import { DocumentTypeModule } from '../document-type/document-type.module';
import { DocumentType } from '../document-type/entities/document-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanApplicationDocument, DocumentType]),
    DocumentTypeModule,
  ],
  controllers: [LoanApplicationDocumentController],
  providers: [LoanApplicationDocumentService],
  exports: [LoanApplicationDocumentService],
})
export class LoanApplicationDocumentModule {}

