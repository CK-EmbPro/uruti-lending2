import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplicationDocument, DocumentStatus } from './entities/loan-application-document.entity';
import { DocumentType } from '../document-type/entities/document-type.entity';
import { DocumentTypeService } from '../document-type/document-type.service';
import { CreateLoanApplicationDocumentDto } from './dto/create-loan-application-document.dto';
import { UpdateLoanApplicationDocumentDto } from './dto/update-loan-application-document.dto';

@Injectable()
export class LoanApplicationDocumentService {
  constructor(
    @InjectRepository(LoanApplicationDocument)
    private readonly documentRepository: Repository<LoanApplicationDocument>,
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
    private readonly documentTypeService: DocumentTypeService,
  ) {}

  async create(
    createDto: CreateLoanApplicationDocumentDto,
  ): Promise<LoanApplicationDocument> {
    // Validate document type
    const documentType = await this.documentTypeService.findByCode(
      createDto.documentType,
    );

    if (!documentType) {
      throw new NotFoundException(
        `Document type with code ${createDto.documentType} not found`,
      );
    }

    if (!documentType.isActive) {
      throw new BadRequestException(
        `Document type ${createDto.documentType} is not active`,
      );
    }

    // Check max documents limit
    const existingCount = await this.documentRepository.count({
      where: {
        loanApplicationId: createDto.loanApplicationId,
        documentType: createDto.documentType,
      },
    });

    if (existingCount >= documentType.maxDocuments) {
      throw new BadRequestException(
        `Maximum ${documentType.maxDocuments} document(s) of type ${createDto.documentType} allowed`,
      );
    }

    // Validate file type if provided
    if (createDto.fileType && documentType.allowedFileTypes) {
      const allowedTypes = documentType.allowedFileTypes
        .split(',')
        .map((t) => t.trim());
      if (!allowedTypes.includes(createDto.fileType)) {
        throw new BadRequestException(
          `File type ${createDto.fileType} not allowed. Allowed types: ${documentType.allowedFileTypes}`,
        );
      }
    }

    // Validate file size if provided
    if (
      createDto.fileSize &&
      documentType.maxFileSize &&
      createDto.fileSize > documentType.maxFileSize
    ) {
      throw new BadRequestException(
        `File size ${createDto.fileSize} exceeds maximum allowed size of ${documentType.maxFileSize} bytes`,
      );
    }

    const document = this.documentRepository.create({
      ...createDto,
      issueDate: createDto.issueDate ? new Date(createDto.issueDate) : null,
      expiryDate: createDto.expiryDate ? new Date(createDto.expiryDate) : null,
      isRequired: createDto.isRequired ?? documentType.isRequired,
      status: createDto.status || DocumentStatus.PENDING,
    });

    return await this.documentRepository.save(document);
  }

  async findAll(): Promise<LoanApplicationDocument[]> {
    return await this.documentRepository.find({
      relations: ['loanApplication'],
    });
  }

  async findByApplicationId(
    applicationId: string,
  ): Promise<LoanApplicationDocument[]> {
    return await this.documentRepository.find({
      where: { loanApplicationId: applicationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LoanApplicationDocument> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['loanApplication'],
    });

    if (!document) {
      throw new NotFoundException(
        `Loan Application Document with ID ${id} not found`,
      );
    }

    return document;
  }

  async update(
    id: string,
    updateDto: UpdateLoanApplicationDocumentDto,
  ): Promise<LoanApplicationDocument> {
    const document = await this.findOne(id);

    // Don't allow updating verified documents
    if (document.status === DocumentStatus.VERIFIED) {
      throw new BadRequestException(
        'Cannot update a verified document. Create a new version instead.',
      );
    }

    Object.assign(document, updateDto);

    if (updateDto.issueDate) {
      document.issueDate = new Date(updateDto.issueDate);
    }

    if (updateDto.expiryDate) {
      document.expiryDate = new Date(updateDto.expiryDate);
    }

    // Increment version if updating
    document.version += 1;

    return await this.documentRepository.save(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);

    // Don't allow deleting verified documents
    if (document.status === DocumentStatus.VERIFIED) {
      throw new BadRequestException('Cannot delete a verified document');
    }

    await this.documentRepository.remove(document);
  }

  /**
   * Verify a document
   */
  async verify(
    id: string,
    verifiedBy: string,
    remarks?: string,
  ): Promise<LoanApplicationDocument> {
    const document = await this.findOne(id);

    if (document.status === DocumentStatus.VERIFIED) {
      throw new BadRequestException('Document is already verified');
    }

    document.status = DocumentStatus.VERIFIED;
    document.verificationDate = new Date();
    document.verifiedBy = verifiedBy;
    document.remarks = remarks;

    return await this.documentRepository.save(document);
  }

  /**
   * Reject a document
   */
  async reject(
    id: string,
    verifiedBy: string,
    rejectionReason: string,
  ): Promise<LoanApplicationDocument> {
    const document = await this.findOne(id);

    if (document.status === DocumentStatus.VERIFIED) {
      throw new BadRequestException('Cannot reject a verified document');
    }

    document.status = DocumentStatus.REJECTED;
    document.verificationDate = new Date();
    document.verifiedBy = verifiedBy;
    document.rejectionReason = rejectionReason;

    return await this.documentRepository.save(document);
  }

  /**
   * Check if all required documents are uploaded
   */
  async checkRequiredDocuments(
    applicationId: string,
  ): Promise<{
    allRequiredUploaded: boolean;
    missingDocuments: string[];
    pendingVerification: string[];
  }> {
    const requiredTypes = await this.documentTypeRepository.find({
      where: { isRequired: true, isActive: true },
    });

    const uploadedDocuments = await this.findByApplicationId(applicationId);

    const uploadedTypes = new Set(
      uploadedDocuments
        .filter((d) => d.status === DocumentStatus.VERIFIED)
        .map((d) => d.documentType),
    );

    const missingDocuments: string[] = [];
    const pendingVerification: string[] = [];

    for (const docType of requiredTypes) {
      const uploaded = uploadedDocuments.find(
        (d) => d.documentType === docType.code,
      );

      if (!uploaded) {
        missingDocuments.push(docType.name);
      } else if (uploaded.status !== DocumentStatus.VERIFIED) {
        pendingVerification.push(docType.name);
      }
    }

    return {
      allRequiredUploaded:
        missingDocuments.length === 0 && pendingVerification.length === 0,
      missingDocuments,
      pendingVerification,
    };
  }

  /**
   * Check for expired documents
   */
  async checkExpiredDocuments(
    applicationId: string,
  ): Promise<LoanApplicationDocument[]> {
    const documents = await this.findByApplicationId(applicationId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expired: LoanApplicationDocument[] = [];

    for (const doc of documents) {
      if (doc.expiryDate) {
        const expiryDate = new Date(doc.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);

        if (expiryDate < today && doc.status !== DocumentStatus.EXPIRED) {
          doc.status = DocumentStatus.EXPIRED;
          await this.documentRepository.save(doc);
          expired.push(doc);
        }
      }
    }

    return expired;
  }
}

