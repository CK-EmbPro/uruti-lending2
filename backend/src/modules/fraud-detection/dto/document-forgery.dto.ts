import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DocumentForgeryCheckRequestDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Document ID', example: 'doc-123' })
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'Document file path or URL', example: '/path/to/document.pdf' })
  @IsString()
  filePath: string;

  @ApiPropertyOptional({ description: 'MIME type', example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class FontAnalysisResultDto {
  @ApiProperty({ description: 'Whether inconsistent fonts detected', example: true })
  @IsBoolean()
  hasInconsistentFonts: boolean;

  @ApiProperty({ description: 'Number of different fonts found', example: 3 })
  @IsNumber()
  fontCount: number;

  @ApiProperty({ description: 'Font names detected', example: ['Arial', 'Times New Roman', 'Courier'] })
  @IsArray()
  fonts: string[];

  @ApiProperty({ description: 'Risk score (0-100)', example: 65 })
  @IsNumber()
  riskScore: number;
}

export class MetadataAnalysisResultDto {
  @ApiProperty({ description: 'Document creation date from metadata', example: '2024-01-15T10:30:00Z' })
  @IsString()
  creationDate?: string;

  @ApiProperty({ description: 'Document modification date from metadata', example: '2024-01-20T14:45:00Z' })
  @IsString()
  modificationDate?: string;

  @ApiProperty({ description: 'Software used to create document', example: 'Adobe Photoshop' })
  @IsString()
  software?: string;

  @ApiProperty({ description: 'Whether metadata discrepancy found', example: true })
  @IsBoolean()
  hasDiscrepancy: boolean;

  @ApiProperty({ description: 'Discrepancy description', example: 'Document claims to be from 2020 but created in 2024' })
  @IsString()
  discrepancyDescription?: string;

  @ApiProperty({ description: 'Risk score (0-100)', example: 80 })
  @IsNumber()
  riskScore: number;
}

export class ImageForensicsResultDto {
  @ApiProperty({ description: 'Whether copy-paste detected', example: true })
  @IsBoolean()
  hasCopyPaste: boolean;

  @ApiProperty({ description: 'Whether resolution issues detected', example: false })
  @IsBoolean()
  hasResolutionIssues: boolean;

  @ApiProperty({ description: 'Image resolution (DPI)', example: 72 })
  @IsNumber()
  resolution?: number;

  @ApiProperty({ description: 'Whether image appears manipulated', example: true })
  @IsBoolean()
  appearsManipulated: boolean;

  @ApiProperty({ description: 'Forensic analysis details', example: 'ELA analysis shows inconsistencies' })
  @IsString()
  analysisDetails?: string;

  @ApiProperty({ description: 'Risk score (0-100)', example: 85 })
  @IsNumber()
  riskScore: number;
}

export class TemplateMatchResultDto {
  @ApiProperty({ description: 'Whether known forgery template matched', example: true })
  @IsBoolean()
  isKnownForgery: boolean;

  @ApiProperty({ description: 'Template ID if matched', example: 'template-123' })
  @IsString()
  templateId?: string;

  @ApiProperty({ description: 'Template name', example: 'Fake ID Template #5' })
  @IsString()
  templateName?: string;

  @ApiProperty({ description: 'Match confidence (0-100)', example: 92 })
  @IsNumber()
  matchConfidence: number;

  @ApiProperty({ description: 'Risk score (0-100)', example: 100 })
  @IsNumber()
  riskScore: number;
}

export class DocumentForgeryResultDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  applicationId: string;

  @ApiProperty({ description: 'Document ID', example: 'doc-123' })
  documentId: string;

  @ApiProperty({ description: 'Font analysis result', type: FontAnalysisResultDto })
  @ValidateNested()
  @Type(() => FontAnalysisResultDto)
  fontAnalysis: FontAnalysisResultDto;

  @ApiProperty({ description: 'Metadata analysis result', type: MetadataAnalysisResultDto })
  @ValidateNested()
  @Type(() => MetadataAnalysisResultDto)
  metadataAnalysis: MetadataAnalysisResultDto;

  @ApiProperty({ description: 'Image forensics result', type: ImageForensicsResultDto })
  @ValidateNested()
  @Type(() => ImageForensicsResultDto)
  imageForensics: ImageForensicsResultDto;

  @ApiProperty({ description: 'Template matching result', type: TemplateMatchResultDto })
  @ValidateNested()
  @Type(() => TemplateMatchResultDto)
  templateMatch: TemplateMatchResultDto;

  @ApiProperty({ description: 'Overall forgery risk score (0-100)', example: 75 })
  @IsNumber()
  overallRiskScore: number;

  @ApiProperty({ description: 'Whether flagged for human review', example: true })
  @IsBoolean()
  requiresHumanReview: boolean;

  @ApiProperty({ description: 'Review reason', example: 'Borderline case: Multiple suspicious indicators' })
  @IsString()
  reviewReason?: string;
}

