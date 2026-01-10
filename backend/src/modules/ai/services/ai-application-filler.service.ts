import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIDocumentProcessorService } from './ai-document-processor.service';
import { ExtractedDataDto } from '../dto/document-processing.dto';
import { LoanApplicationService } from '../../loan-application/loan-application.service';
import { UpdateLoanApplicationDto } from '../../loan-application/dto/update-loan-application.dto';
import { AIDocumentProcessing } from '../entities/ai-document-processing.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

@Injectable()
export class AIApplicationFillerService {
  private readonly logger = new Logger(AIApplicationFillerService.name);

  constructor(
    private readonly aiDocumentProcessor: AIDocumentProcessorService,
    private readonly loanApplicationService: LoanApplicationService,
    @InjectRepository(AIDocumentProcessing)
    private readonly processingRepository: Repository<AIDocumentProcessing>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Process document and auto-fill loan application
   */
  async processDocumentAndFillApplication(
    documentId: string,
    applicationId: string,
    documentType: string,
    fileUrl?: string,
    filePath?: string,
    mimeType?: string,
  ): Promise<{ extractedData: ExtractedDataDto; filledFields: string[] }> {
    this.logger.log(`Processing document ${documentId} and filling application ${applicationId}`);

    // Step 1: Process document with AI
    const processingResult = await this.aiDocumentProcessor.processDocument({
      documentId,
      documentType: documentType as any,
      fileUrl,
      filePath,
      mimeType,
      autoFillApplication: true,
    });

    if (!processingResult.success) {
      throw new Error('Failed to process document');
    }

    // Step 2: Map extracted data to loan application fields
    const updateDto = this.mapExtractedDataToApplication(processingResult.extractedData, documentType);
    const filledFields = Object.keys(updateDto);

    // Step 3: Update loan application with extracted data
    if (filledFields.length > 0) {
      // Get application to retrieve companyId
      const application = await this.applicationRepository.findOne({
        where: { id: applicationId },
      });
      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }
      await this.loanApplicationService.update(applicationId, updateDto, application.companyId);
      this.logger.log(`Auto-filled ${filledFields.length} fields in application ${applicationId}`);

      // Update processing record with auto-fill information
      const processingRecord = await this.processingRepository.findOne({
        where: { documentId },
      });
      if (processingRecord) {
        processingRecord.applicationId = applicationId;
        processingRecord.autoFilled = true;
        processingRecord.filledFields = filledFields;
        await this.processingRepository.save(processingRecord);
      }
    }

    return {
      extractedData: processingResult.extractedData,
      filledFields,
    };
  }

  /**
   * Map extracted data to loan application update DTO
   */
  private mapExtractedDataToApplication(
    extractedData: ExtractedDataDto,
    documentType: string,
  ): Partial<UpdateLoanApplicationDto> {
    const updateDto: any = {};

    // Map common fields that might be in loan application
    // Note: Adjust based on your actual loan application entity structure

    // For now, we'll store extracted data in remarks or a JSON field
    // In a real implementation, you'd map to actual application fields
    if (extractedData.fullName) {
      // If loan application has applicant name field, map it here
      // updateDto.applicantName = extractedData.fullName;
    }

    if (extractedData.monthlyIncome) {
      // Map to income field if exists
      // updateDto.monthlyIncome = extractedData.monthlyIncome;
    }

    // Store extracted data as metadata
    updateDto.remarks = `AI-extracted data: ${JSON.stringify(extractedData.extractedFields || {})}`;

    return updateDto;
  }
}

