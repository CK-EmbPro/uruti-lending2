import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from '../../document-type/entities/document-type.entity';
import { AIDocumentProcessorService } from '../../ai/services/ai-document-processor.service';
import { ClassifyDocumentDto, DocumentClassificationResult } from '../dto/document-classification.dto';

@Injectable()
export class DocumentClassificationService {
  private readonly logger = new Logger(DocumentClassificationService.name);

  // Document type patterns and keywords - Expanded to support 50+ document types
  private readonly documentPatterns: Record<string, {
    keywords: string[];
    category: string;
    required: boolean;
    typeCode: string;
  }> = {
    // Identity Documents
    ID_CARD: {
      keywords: ['id card', 'identity card', 'national id', 'citizen card'],
      category: 'Identity',
      required: true,
      typeCode: 'ID_CARD',
    },
    PASSPORT: {
      keywords: ['passport', 'travel document'],
      category: 'Identity',
      required: false,
      typeCode: 'PASSPORT',
    },
    DRIVERS_LICENSE: {
      keywords: ['driver', 'driving license', 'driving licence'],
      category: 'Identity',
      required: false,
      typeCode: 'DRIVERS_LICENSE',
    },
    PAN_CARD: {
      keywords: ['pan', 'permanent account number', 'income tax', 'tax id'],
      category: 'Identity',
      required: true,
      typeCode: 'PAN_CARD',
    },
    AADHAAR: {
      keywords: ['aadhaar', 'uid', 'unique identification'],
      category: 'Identity',
      required: true,
      typeCode: 'AADHAAR',
    },
    VOTERS_ID: {
      keywords: ['voter', 'voting card', 'electoral card'],
      category: 'Identity',
      required: false,
      typeCode: 'VOTERS_ID',
    },
    BIRTH_CERTIFICATE: {
      keywords: ['birth certificate', 'birth cert'],
      category: 'Identity',
      required: false,
      typeCode: 'BIRTH_CERTIFICATE',
    },
    MARRIAGE_CERTIFICATE: {
      keywords: ['marriage certificate', 'marriage cert'],
      category: 'Identity',
      required: false,
      typeCode: 'MARRIAGE_CERTIFICATE',
    },
    SOCIAL_SECURITY_CARD: {
      keywords: ['social security', 'ssn', 'ss card'],
      category: 'Identity',
      required: false,
      typeCode: 'SOCIAL_SECURITY_CARD',
    },
    RESIDENCE_PERMIT: {
      keywords: ['residence permit', 'residence card', 'permit'],
      category: 'Identity',
      required: false,
      typeCode: 'RESIDENCE_PERMIT',
    },
    // Financial Documents
    BANK_STATEMENT: {
      keywords: ['bank statement', 'account statement', 'statement of account', 'transaction history'],
      category: 'Financial',
      required: true,
      typeCode: 'BANK_STATEMENT',
    },
    PAYSLIP: {
      keywords: ['payslip', 'salary slip', 'pay stub', 'wage statement', 'salary statement'],
      category: 'Income',
      required: true,
      typeCode: 'PAYSLIP',
    },
    TAX_RETURN: {
      keywords: ['tax return', 'income tax return', 'itr'],
      category: 'Income',
      required: false,
      typeCode: 'TAX_RETURN',
    },
    TAX_FORM_16: {
      keywords: ['form 16', 'form16', 'tax form 16'],
      category: 'Income',
      required: false,
      typeCode: 'TAX_FORM_16',
    },
    TAX_FORM_1040: {
      keywords: ['form 1040', 'form1040', 'tax form 1040'],
      category: 'Income',
      required: false,
      typeCode: 'TAX_FORM_1040',
    },
    TAX_W2: {
      keywords: ['w2', 'w-2', 'wage and tax statement'],
      category: 'Income',
      required: false,
      typeCode: 'TAX_W2',
    },
    TAX_1099: {
      keywords: ['1099', '1099 form'],
      category: 'Income',
      required: false,
      typeCode: 'TAX_1099',
    },
    INCOME_STATEMENT: {
      keywords: ['income statement', 'profit and loss', 'p&l'],
      category: 'Financial',
      required: false,
      typeCode: 'INCOME_STATEMENT',
    },
    BALANCE_SHEET: {
      keywords: ['balance sheet', 'financial statement'],
      category: 'Financial',
      required: false,
      typeCode: 'BALANCE_SHEET',
    },
    PROFIT_LOSS_STATEMENT: {
      keywords: ['profit loss', 'profit and loss statement', 'p&l statement'],
      category: 'Financial',
      required: false,
      typeCode: 'PROFIT_LOSS_STATEMENT',
    },
    BANK_LETTER: {
      keywords: ['bank letter', 'bank certificate', 'bank confirmation'],
      category: 'Financial',
      required: false,
      typeCode: 'BANK_LETTER',
    },
    CREDIT_REPORT: {
      keywords: ['credit report', 'credit score', 'credit history'],
      category: 'Financial',
      required: false,
      typeCode: 'CREDIT_REPORT',
    },
    INVESTMENT_STATEMENT: {
      keywords: ['investment statement', 'portfolio statement'],
      category: 'Financial',
      required: false,
      typeCode: 'INVESTMENT_STATEMENT',
    },
    RETIREMENT_STATEMENT: {
      keywords: ['retirement statement', '401k', 'pension statement'],
      category: 'Financial',
      required: false,
      typeCode: 'RETIREMENT_STATEMENT',
    },
    DIVIDEND_STATEMENT: {
      keywords: ['dividend statement', 'dividend'],
      category: 'Financial',
      required: false,
      typeCode: 'DIVIDEND_STATEMENT',
    },
    // Address Proof
    UTILITY_BILL: {
      keywords: ['utility bill', 'utility'],
      category: 'Address',
      required: false,
      typeCode: 'UTILITY_BILL',
    },
    ELECTRICITY_BILL: {
      keywords: ['electricity bill', 'electric bill', 'power bill'],
      category: 'Address',
      required: false,
      typeCode: 'ELECTRICITY_BILL',
    },
    WATER_BILL: {
      keywords: ['water bill', 'water'],
      category: 'Address',
      required: false,
      typeCode: 'WATER_BILL',
    },
    GAS_BILL: {
      keywords: ['gas bill', 'gas'],
      category: 'Address',
      required: false,
      typeCode: 'GAS_BILL',
    },
    PHONE_BILL: {
      keywords: ['phone bill', 'telephone bill', 'mobile bill'],
      category: 'Address',
      required: false,
      typeCode: 'PHONE_BILL',
    },
    INTERNET_BILL: {
      keywords: ['internet bill', 'broadband bill'],
      category: 'Address',
      required: false,
      typeCode: 'INTERNET_BILL',
    },
    RENTAL_AGREEMENT: {
      keywords: ['rental agreement', 'lease agreement', 'rent agreement'],
      category: 'Address',
      required: false,
      typeCode: 'RENTAL_AGREEMENT',
    },
    PROPERTY_DEED: {
      keywords: ['property deed', 'deed', 'property document'],
      category: 'Address',
      required: false,
      typeCode: 'PROPERTY_DEED',
    },
    // Employment Documents
    EMPLOYMENT_LETTER: {
      keywords: ['employment letter', 'job letter'],
      category: 'Employment',
      required: false,
      typeCode: 'EMPLOYMENT_LETTER',
    },
    OFFER_LETTER: {
      keywords: ['offer letter', 'job offer'],
      category: 'Employment',
      required: false,
      typeCode: 'OFFER_LETTER',
    },
    APPOINTMENT_LETTER: {
      keywords: ['appointment letter', 'appointment'],
      category: 'Employment',
      required: false,
      typeCode: 'APPOINTMENT_LETTER',
    },
    CONTRACT: {
      keywords: ['contract', 'employment contract', 'service contract'],
      category: 'Employment',
      required: false,
      typeCode: 'CONTRACT',
    },
    SALARY_CERTIFICATE: {
      keywords: ['salary certificate', 'salary cert'],
      category: 'Employment',
      required: false,
      typeCode: 'SALARY_CERTIFICATE',
    },
    EXPERIENCE_CERTIFICATE: {
      keywords: ['experience certificate', 'experience cert', 'work experience'],
      category: 'Employment',
      required: false,
      typeCode: 'EXPERIENCE_CERTIFICATE',
    },
    REFERENCE_LETTER: {
      keywords: ['reference letter', 'reference', 'recommendation letter'],
      category: 'Employment',
      required: false,
      typeCode: 'REFERENCE_LETTER',
    },
    // Business Documents
    BUSINESS_LICENSE: {
      keywords: ['business license', 'business licence', 'trade license'],
      category: 'Business',
      required: false,
      typeCode: 'BUSINESS_LICENSE',
    },
    REGISTRATION_CERTIFICATE: {
      keywords: ['registration certificate', 'company registration', 'registration'],
      category: 'Business',
      required: false,
      typeCode: 'REGISTRATION_CERTIFICATE',
    },
    GST_CERTIFICATE: {
      keywords: ['gst certificate', 'gst', 'goods and services tax'],
      category: 'Business',
      required: false,
      typeCode: 'GST_CERTIFICATE',
    },
    VAT_CERTIFICATE: {
      keywords: ['vat certificate', 'vat', 'value added tax'],
      category: 'Business',
      required: false,
      typeCode: 'VAT_CERTIFICATE',
    },
    PARTNERSHIP_DEED: {
      keywords: ['partnership deed', 'partnership'],
      category: 'Business',
      required: false,
      typeCode: 'PARTNERSHIP_DEED',
    },
    ARTICLES_OF_INCORPORATION: {
      keywords: ['articles of incorporation', 'incorporation', 'corporate charter'],
      category: 'Business',
      required: false,
      typeCode: 'ARTICLES_OF_INCORPORATION',
    },
    // Educational Documents
    DEGREE_CERTIFICATE: {
      keywords: ['degree certificate', 'degree', 'graduation certificate'],
      category: 'Educational',
      required: false,
      typeCode: 'DEGREE_CERTIFICATE',
    },
    DIPLOMA: {
      keywords: ['diploma', 'diploma certificate'],
      category: 'Educational',
      required: false,
      typeCode: 'DIPLOMA',
    },
    TRANSCRIPT: {
      keywords: ['transcript', 'academic transcript', 'marksheet'],
      category: 'Educational',
      required: false,
      typeCode: 'TRANSCRIPT',
    },
    EDUCATIONAL_CERTIFICATE: {
      keywords: ['educational certificate', 'education cert', 'academic certificate'],
      category: 'Educational',
      required: false,
      typeCode: 'EDUCATIONAL_CERTIFICATE',
    },
    // Other
    ADDRESS_PROOF: {
      keywords: ['address proof', 'residence proof', 'proof of address'],
      category: 'Address',
      required: true,
      typeCode: 'ADDRESS_PROOF',
    },
  };

  constructor(
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
    private readonly aiDocumentProcessor: AIDocumentProcessorService,
  ) {}

  /**
   * Classify a document automatically
   */
  async classifyDocument(
    dto: ClassifyDocumentDto,
    companyId: string,
  ): Promise<DocumentClassificationResult> {
    this.logger.log(`Classifying document: ${dto.fileUrl}`);

    // Step 1: Extract text from document using AI
    let extractedText = '';
    let metadata: Record<string, any> = {};

    try {
      const processingResult = await this.aiDocumentProcessor.processDocument({
        documentId: 'temp-' + Date.now(),
        documentType: 'UNKNOWN' as any,
        fileUrl: dto.fileUrl,
        filePath: dto.filePath,
        mimeType: dto.mimeType,
      });

      if (processingResult.success && processingResult.extractedData) {
        extractedText = (processingResult.extractedData as any).extractedText?.toLowerCase() || '';
        metadata = processingResult.extractedData.extractedFields || {};
      }
    } catch (error) {
      this.logger.warn(`AI processing failed, using fallback classification: ${error.message}`);
    }

    // Step 2: Classify based on file name and content
    const fileName = (dto.fileName || '').toLowerCase();
    const classification = this.classifyByPattern(fileName, extractedText, metadata);

    // Step 3: Get document type from database (if exists)
    const documentType = await this.documentTypeRepository.findOne({
      where: { code: classification.typeCode } as any, // DocumentType may not have companyId
    });

    // Step 4: Validate document
    const validation = this.validateDocument(classification, metadata, documentType);

    // Step 5: Generate suggestions
    const suggestions = this.generateSuggestions(classification, validation, documentType);

    return {
      documentType: classification.typeCode,
      category: classification.category,
      confidence: classification.confidence,
      isRequired: classification.required,
      suggestedTypeCode: classification.typeCode,
      metadata: {
        documentNumber: metadata.documentNumber || metadata.idNumber,
        issueDate: metadata.issueDate,
        expiryDate: metadata.expiryDate,
        issuer: metadata.issuer || metadata.issuedBy,
        ...metadata,
      },
      validationStatus: validation.status,
      validationErrors: validation.errors,
      suggestions,
    };
  }

  /**
   * Classify document by pattern matching
   */
  private classifyByPattern(
    fileName: string,
    extractedText: string,
    metadata: Record<string, any>,
  ): {
    typeCode: string;
    category: string;
    required: boolean;
    confidence: number;
  } {
    const combinedText = `${fileName} ${extractedText}`.toLowerCase();

    // Score each document type
    const scores: Record<string, number> = {};

    for (const [type, pattern] of Object.entries(this.documentPatterns)) {
      let score = 0;

      // Check file name
      for (const keyword of pattern.keywords) {
        if (fileName.includes(keyword)) {
          score += 3; // High weight for file name
        }
      }

      // Check extracted text
      for (const keyword of pattern.keywords) {
        if (combinedText.includes(keyword)) {
          score += 2; // Medium weight for content
        }
      }

      // Check metadata
      if (metadata.documentType && metadata.documentType.toLowerCase().includes(type.toLowerCase())) {
        score += 5; // Very high weight
      }

      scores[type] = score;
    }

    // Find best match
    let bestType = 'UNKNOWN';
    let bestScore = 0;

    for (const [type, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = type;
      }
    }

    // Calculate confidence (0-1)
    const maxPossibleScore = 10; // Approximate max
    const confidence = Math.min(1, bestScore / maxPossibleScore);

    const pattern = this.documentPatterns[bestType] || {
      keywords: [],
      category: 'Other',
      required: false,
      typeCode: 'UNKNOWN',
    };

    return {
      typeCode: pattern.typeCode,
      category: pattern.category,
      required: pattern.required,
      confidence: Math.max(0.5, confidence), // Minimum 50% confidence
    };
  }

  /**
   * Validate classified document
   */
  private validateDocument(
    classification: any,
    metadata: Record<string, any>,
    documentType: DocumentType | null,
  ): {
    status: 'VALID' | 'INVALID' | 'NEEDS_REVIEW';
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if document type exists in system
    if (!documentType) {
      errors.push(`Document type ${classification.typeCode} not configured in system`);
    }

    // Check expiry date (if applicable)
    if (metadata.expiryDate) {
      const expiry = new Date(metadata.expiryDate);
      if (expiry < new Date()) {
        errors.push('Document has expired');
      }
    }

    // Check required fields based on document type
    if (classification.typeCode === 'PAN' && !metadata.documentNumber) {
      errors.push('PAN number not found in document');
    }

    if (classification.typeCode === 'BANK_STATEMENT' && !metadata.accountNumber) {
      errors.push('Account number not found in bank statement');
    }

    if (classification.typeCode === 'PAYSLIP' && !metadata.income) {
      errors.push('Income information not found in payslip');
    }

    // Determine validation status
    let status: 'VALID' | 'INVALID' | 'NEEDS_REVIEW';
    if (errors.length === 0 && classification.confidence >= 0.8) {
      status = 'VALID';
    } else if (errors.length > 0 && classification.confidence < 0.6) {
      status = 'INVALID';
    } else {
      status = 'NEEDS_REVIEW';
    }

    return { status, errors };
  }

  /**
   * Generate suggestions
   */
  private generateSuggestions(
    classification: any,
    validation: any,
    documentType: DocumentType | null,
  ): string[] {
    const suggestions: string[] = [];

    if (validation.status === 'NEEDS_REVIEW') {
      suggestions.push('Document may need manual review. Please verify the classification.');
    }

    if (classification.confidence < 0.7) {
      suggestions.push('Low confidence classification. Please verify document type manually.');
    }

    if (!documentType) {
      suggestions.push(`Document type ${classification.typeCode} needs to be configured in the system.`);
    }

    if (validation.errors.length > 0) {
      suggestions.push('Some required information is missing from the document.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Document classified successfully. Ready for verification.');
    }

    return suggestions;
  }

  /**
   * Batch classify multiple documents
   */
  async batchClassify(
    documents: ClassifyDocumentDto[],
    companyId: string,
  ): Promise<DocumentClassificationResult[]> {
    const results: DocumentClassificationResult[] = [];

    for (const doc of documents) {
      try {
        const result = await this.classifyDocument(doc, companyId);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to classify document ${doc.fileUrl}: ${error.message}`);
        // Add error result
        results.push({
          documentType: 'UNKNOWN',
          category: 'Other',
          confidence: 0,
          isRequired: false,
          suggestedTypeCode: 'UNKNOWN',
          metadata: {},
          validationStatus: 'INVALID',
          validationErrors: [error.message],
          suggestions: ['Document classification failed. Please classify manually.'],
        });
      }
    }

    return results;
  }
}

