import { IsString, IsOptional, IsObject, IsEnum, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum DocumentType {
  // Identity Documents (10 types)
  ID_CARD = 'ID_CARD', // National ID
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  PAN_CARD = 'PAN_CARD', // Permanent Account Number
  AADHAAR = 'AADHAAR', // Unique Identification
  VOTERS_ID = 'VOTERS_ID',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
  SOCIAL_SECURITY_CARD = 'SOCIAL_SECURITY_CARD',
  RESIDENCE_PERMIT = 'RESIDENCE_PERMIT',
  
  // Financial Documents (15 types)
  BANK_STATEMENT = 'BANK_STATEMENT',
  PAYSLIP = 'PAYSLIP',
  TAX_RETURN = 'TAX_RETURN',
  TAX_FORM_16 = 'TAX_FORM_16',
  TAX_FORM_1040 = 'TAX_FORM_1040',
  TAX_W2 = 'TAX_W2',
  TAX_1099 = 'TAX_1099',
  INCOME_STATEMENT = 'INCOME_STATEMENT',
  BALANCE_SHEET = 'BALANCE_SHEET',
  PROFIT_LOSS_STATEMENT = 'PROFIT_LOSS_STATEMENT',
  BANK_LETTER = 'BANK_LETTER',
  CREDIT_REPORT = 'CREDIT_REPORT',
  INVESTMENT_STATEMENT = 'INVESTMENT_STATEMENT',
  RETIREMENT_STATEMENT = 'RETIREMENT_STATEMENT',
  DIVIDEND_STATEMENT = 'DIVIDEND_STATEMENT',
  
  // Address Proof (8 types)
  UTILITY_BILL = 'UTILITY_BILL',
  ELECTRICITY_BILL = 'ELECTRICITY_BILL',
  WATER_BILL = 'WATER_BILL',
  GAS_BILL = 'GAS_BILL',
  PHONE_BILL = 'PHONE_BILL',
  INTERNET_BILL = 'INTERNET_BILL',
  RENTAL_AGREEMENT = 'RENTAL_AGREEMENT',
  PROPERTY_DEED = 'PROPERTY_DEED',
  
  // Employment Documents (7 types)
  EMPLOYMENT_LETTER = 'EMPLOYMENT_LETTER',
  OFFER_LETTER = 'OFFER_LETTER',
  APPOINTMENT_LETTER = 'APPOINTMENT_LETTER',
  CONTRACT = 'CONTRACT',
  SALARY_CERTIFICATE = 'SALARY_CERTIFICATE',
  EXPERIENCE_CERTIFICATE = 'EXPERIENCE_CERTIFICATE',
  REFERENCE_LETTER = 'REFERENCE_LETTER',
  
  // Business Documents (6 types)
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  REGISTRATION_CERTIFICATE = 'REGISTRATION_CERTIFICATE',
  GST_CERTIFICATE = 'GST_CERTIFICATE',
  VAT_CERTIFICATE = 'VAT_CERTIFICATE',
  PARTNERSHIP_DEED = 'PARTNERSHIP_DEED',
  ARTICLES_OF_INCORPORATION = 'ARTICLES_OF_INCORPORATION',
  
  // Educational Documents (4 types)
  DEGREE_CERTIFICATE = 'DEGREE_CERTIFICATE',
  DIPLOMA = 'DIPLOMA',
  TRANSCRIPT = 'TRANSCRIPT',
  EDUCATIONAL_CERTIFICATE = 'EDUCATIONAL_CERTIFICATE',
  
  // Other Documents
  OTHER = 'OTHER',
}

export class ProcessDocumentDto {
  @ApiProperty({ 
    description: 'Document ID', 
    example: 'doc-123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsString()
  documentId: string;

  @ApiProperty({ 
    description: 'Document type', 
    enum: DocumentType,
    example: DocumentType.ID_CARD 
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiPropertyOptional({ 
    description: 'URL to the document file', 
    example: 'https://example.com/documents/id-card.jpg' 
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Local file path to the document', 
    example: '/uploads/documents/id-card.jpg' 
  })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({ 
    description: 'MIME type of the document', 
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'application/pdf']
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ 
    description: 'Whether to auto-fill loan application fields after processing', 
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  autoFillApplication?: boolean;
}

export class CrossFieldValidationDto {
  @ApiProperty({ 
    description: 'Whether names are consistent across fields', 
    example: true 
  })
  nameConsistency: boolean;

  @ApiProperty({ 
    description: 'Whether ID format is valid', 
    example: true 
  })
  idConsistency: boolean;

  @ApiProperty({ 
    description: 'Whether photo is accessible and valid', 
    example: true 
  })
  photoConsistency: boolean;

  @ApiProperty({ 
    description: 'List of cross-field validation issues found', 
    type: [String],
    example: [] 
  })
  @IsArray()
  issues: string[];
}

export class ExtractedDataDto {
  // Common fields
  @ApiPropertyOptional({ description: 'Full name extracted from document', example: 'John Doe' })
  fullName?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1990-01-15' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'ID number', example: 'ABC123456' })
  idNumber?: string;

  @ApiPropertyOptional({ description: 'Address', example: '123 Main St, City, State 12345' })
  address?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1-555-123-4567' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john.doe@example.com' })
  email?: string;

  @ApiPropertyOptional({ description: 'URL to extracted photo from document', example: 'https://example.com/photos/id-photo.jpg' })
  photoUrl?: string;

  // Financial fields
  @ApiPropertyOptional({ description: 'Account number (from bank statements)', example: '1234567890' })
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Bank name', example: 'Chase Bank' })
  bankName?: string;

  @ApiPropertyOptional({ description: 'Average balance', example: 5000.00 })
  averageBalance?: number;

  @ApiPropertyOptional({ description: 'Monthly income', example: 5000.00 })
  monthlyIncome?: number;

  @ApiPropertyOptional({ description: 'Employment status', example: 'Full-time' })
  employmentStatus?: string;

  @ApiPropertyOptional({ description: 'Employer name', example: 'ABC Corporation' })
  employerName?: string;

  @ApiPropertyOptional({ description: 'Tax ID', example: '12-3456789' })
  taxId?: string;

  // Dates
  @ApiPropertyOptional({ description: 'Issue date', example: '2020-01-15' })
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Expiry date', example: '2030-01-15' })
  expiryDate?: string;

  @ApiPropertyOptional({ 
    description: 'Statement period (for bank statements)', 
    example: { startDate: '2024-01-01', endDate: '2024-01-31' }
  })
  statementPeriod?: {
    startDate: string;
    endDate: string;
  };

  // Additional extracted data
  @ApiPropertyOptional({ description: 'Raw extracted text (first 1000 characters)', example: 'Sample extracted text...' })
  rawText?: string;

  @ApiPropertyOptional({ description: 'Confidence score (0-1)', example: 0.95, minimum: 0, maximum: 1 })
  confidence?: number;

  @ApiPropertyOptional({ description: 'Additional extracted fields', type: Object })
  extractedFields?: Record<string, any>;
  
  // Verification metadata
  @ApiPropertyOptional({ 
    description: 'OCR accuracy score (0-1). 98%+ for typed, 90%+ for handwritten', 
    example: 0.98, 
    minimum: 0, 
    maximum: 1 
  })
  @IsOptional()
  @IsNumber()
  ocrAccuracy?: number;

  @ApiPropertyOptional({ 
    description: 'Whether text is handwritten', 
    example: false 
  })
  @IsOptional()
  @IsBoolean()
  isHandwritten?: boolean;

  @ApiPropertyOptional({ 
    description: 'Authenticity check score (0-1). Higher is more authentic', 
    example: 0.85, 
    minimum: 0, 
    maximum: 1 
  })
  @IsOptional()
  @IsNumber()
  authenticityScore?: number;

  @ApiPropertyOptional({ 
    description: 'Quality issues found (blurry, partial, tampered, etc.)', 
    type: [String],
    example: [] 
  })
  @IsOptional()
  @IsArray()
  qualityFlags?: string[];

  @ApiPropertyOptional({ 
    description: 'Cross-field validation results', 
    type: CrossFieldValidationDto 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CrossFieldValidationDto)
  crossFieldValidation?: CrossFieldValidationDto;
}

export class AuthenticityCheckDto {
  @ApiProperty({ 
    description: 'Whether authenticity check passed (score >= 0.7)', 
    example: true 
  })
  passed: boolean;

  @ApiProperty({ 
    description: 'Authenticity score (0-1). Higher is more authentic', 
    example: 0.85, 
    minimum: 0, 
    maximum: 1 
  })
  score: number;

  @ApiProperty({ 
    description: 'List of authenticity issues found', 
    type: [String],
    example: [] 
  })
  @IsArray()
  issues: string[];
}

export class QualityCheckDto {
  @ApiProperty({ 
    description: 'Whether image appears blurry', 
    example: false 
  })
  blurry: boolean;

  @ApiProperty({ 
    description: 'Whether image appears cropped or partial', 
    example: false 
  })
  partial: boolean;

  @ApiProperty({ 
    description: 'Whether image shows signs of tampering', 
    example: false 
  })
  tampered: boolean;

  @ApiProperty({ 
    description: 'List of quality issues found', 
    type: [String],
    example: [] 
  })
  @IsArray()
  issues: string[];
}

export class OCRMetricsDto {
  @ApiProperty({ 
    description: 'OCR accuracy (0-1). 98%+ for typed, 90%+ for handwritten', 
    example: 0.98, 
    minimum: 0, 
    maximum: 1 
  })
  accuracy: number;

  @ApiProperty({ 
    description: 'Whether text is handwritten', 
    example: false 
  })
  isHandwritten: boolean;

  @ApiProperty({ 
    description: 'Overall OCR confidence (0-1)', 
    example: 0.95, 
    minimum: 0, 
    maximum: 1 
  })
  confidence: number;
}

export class DocumentProcessingResultDto {
  @ApiProperty({ 
    description: 'Whether processing was successful', 
    example: true 
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Document ID', 
    example: 'doc-123e4567-e89b-12d3-a456-426614174000' 
  })
  documentId: string;

  @ApiProperty({ 
    description: 'Extracted data from document', 
    type: ExtractedDataDto 
  })
  @ValidateNested()
  @Type(() => ExtractedDataDto)
  extractedData: ExtractedDataDto;

  @ApiPropertyOptional({ 
    description: 'Validation errors found', 
    type: [String],
    example: [] 
  })
  @IsOptional()
  @IsArray()
  validationErrors?: string[];

  @ApiPropertyOptional({ 
    description: 'Suggestions for manual review', 
    type: Object,
    example: {} 
  })
  @IsOptional()
  @IsObject()
  suggestions?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'Processing time in milliseconds', 
    example: 3500,
    minimum: 0 
  })
  @IsOptional()
  @IsNumber()
  processingTime?: number;

  @ApiPropertyOptional({ 
    description: 'AI model/provider used', 
    example: 'openai',
    enum: ['openai', 'google', 'aws'] 
  })
  @IsOptional()
  @IsString()
  aiModel?: string;
  
  // Verification results
  @ApiPropertyOptional({ 
    description: 'Document authenticity check results', 
    type: AuthenticityCheckDto 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthenticityCheckDto)
  authenticityCheck?: AuthenticityCheckDto;

  @ApiPropertyOptional({ 
    description: 'Image quality check results', 
    type: QualityCheckDto 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QualityCheckDto)
  qualityCheck?: QualityCheckDto;

  @ApiPropertyOptional({ 
    description: 'OCR accuracy metrics', 
    type: OCRMetricsDto 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OCRMetricsDto)
  ocrMetrics?: OCRMetricsDto;
}

