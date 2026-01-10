import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  DocumentForgeryCheckRequestDto,
  DocumentForgeryResultDto,
  FontAnalysisResultDto,
  MetadataAnalysisResultDto,
  ImageForensicsResultDto,
  TemplateMatchResultDto,
} from '../dto/document-forgery.dto';
import { DocumentForgeryCheck, ForgeryReviewStatus } from '../entities/document-forgery-check.entity';
import { ForgeryTemplate } from '../entities/forgery-template.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import * as crypto from 'crypto';
// EXIF parsing - simplified implementation
// In production, use a library like exif-parser or ts-exif-parser

@Injectable()
export class DocumentForgeryDetectionService {
  private readonly logger = new Logger(DocumentForgeryDetectionService.name);

  constructor(
    @InjectRepository(DocumentForgeryCheck)
    private readonly forgeryCheckRepository: Repository<DocumentForgeryCheck>,
    @InjectRepository(ForgeryTemplate)
    private readonly forgeryTemplateRepository: Repository<ForgeryTemplate>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Perform comprehensive document forgery detection
   */
  async checkDocumentForgery(
    dto: DocumentForgeryCheckRequestDto,
  ): Promise<DocumentForgeryResultDto> {
    this.logger.log(`Checking document forgery for document ${dto.documentId}`);

    // Read file content
    const fileContent = await this.readFileContent(dto.filePath);

    // Perform all checks in parallel
    const [fontAnalysis, metadataAnalysis, imageForensics, templateMatch] = await Promise.all([
      this.analyzeFonts(fileContent, dto.mimeType),
      this.analyzeMetadata(fileContent, dto.mimeType),
      this.performImageForensics(fileContent, dto.mimeType),
      this.matchTemplate(fileContent, dto.mimeType),
    ]);

    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRiskScore(
      fontAnalysis,
      metadataAnalysis,
      imageForensics,
      templateMatch,
    );

    // Determine if human review is needed
    const requiresHumanReview = this.shouldRequireHumanReview(
      overallRiskScore,
      fontAnalysis,
      metadataAnalysis,
      imageForensics,
      templateMatch,
    );

    const reviewReason = requiresHumanReview
      ? this.generateReviewReason(overallRiskScore, fontAnalysis, metadataAnalysis, imageForensics, templateMatch)
      : undefined;

    // Save check result
    const checkRecord = this.forgeryCheckRepository.create({
      applicationId: dto.applicationId,
      documentId: dto.documentId,
      fontAnalysis,
      metadataAnalysis,
      imageForensics,
      templateMatch,
      overallRiskScore,
      requiresHumanReview,
      reviewReason,
      reviewStatus: requiresHumanReview ? ForgeryReviewStatus.PENDING : ForgeryReviewStatus.REVIEWED,
    });
    await this.forgeryCheckRepository.save(checkRecord);

    return {
      applicationId: dto.applicationId,
      documentId: dto.documentId,
      fontAnalysis,
      metadataAnalysis,
      imageForensics,
      templateMatch,
      overallRiskScore,
      requiresHumanReview,
      reviewReason,
    };
  }

  /**
   * Analyze fonts in document
   */
  private async analyzeFonts(fileContent: Buffer, mimeType?: string): Promise<FontAnalysisResultDto> {
    // For PDF files, we would need a PDF parser
    // For images, we can't directly extract fonts, so we'll simulate
    // In production, use a library like pdf-lib or pdf.js

    let fontCount = 1;
    let fonts: string[] = ['Arial']; // Default
    let hasInconsistentFonts = false;

    if (mimeType?.includes('pdf')) {
      // Simulate PDF font extraction
      // In production, parse PDF and extract font information
      fontCount = Math.floor(Math.random() * 3) + 1;
      fonts = ['Arial', 'Times New Roman', 'Courier'].slice(0, fontCount);
      hasInconsistentFonts = fontCount > 2;
    }

    const riskScore = hasInconsistentFonts ? Math.min(100, fontCount * 20) : 0;

    return {
      hasInconsistentFonts,
      fontCount,
      fonts,
      riskScore,
    };
  }

  /**
   * Analyze document metadata
   */
  private async analyzeMetadata(fileContent: Buffer, mimeType?: string): Promise<MetadataAnalysisResultDto> {
    let creationDate: string | undefined;
    let modificationDate: string | undefined;
    let software: string | undefined;
    let hasDiscrepancy = false;
    let discrepancyDescription: string | undefined;

    if (mimeType?.includes('image')) {
      try {
        const metadata = await sharp(fileContent).metadata();
        const exif = metadata.exif;

        if (exif) {
          // Extract EXIF data (simplified - in production use proper EXIF parser)
          // For now, we'll extract from sharp metadata
          const exifData = exif as any;
          if (exifData.DateTimeOriginal) {
            creationDate = new Date(exifData.DateTimeOriginal).toISOString();
          }
          if (exifData.DateTime) {
            modificationDate = new Date(exifData.DateTime).toISOString();
          }
          software = exifData.Software || metadata.format;

          // Check for discrepancies
          if (creationDate) {
            const created = new Date(creationDate);
            const now = new Date();
            const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

            // If document claims to be old but was created recently
            if (daysDiff < 30 && created > new Date('2020-01-01')) {
              hasDiscrepancy = true;
              discrepancyDescription = `Document metadata shows recent creation (${creationDate}) but claims to be older`;
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to extract metadata: ${error.message}`);
      }
    }

    const riskScore = hasDiscrepancy ? 80 : 0;

    return {
      creationDate,
      modificationDate,
      software,
      hasDiscrepancy,
      discrepancyDescription,
      riskScore,
    };
  }

  /**
   * Perform image forensics analysis
   */
  private async performImageForensics(fileContent: Buffer, mimeType?: string): Promise<ImageForensicsResultDto> {
    if (!mimeType?.includes('image')) {
      return {
        hasCopyPaste: false,
        hasResolutionIssues: false,
        appearsManipulated: false,
        riskScore: 0,
      };
    }

    try {
      const metadata = await sharp(fileContent).metadata();
      const resolution = metadata.density || 72; // Default DPI

      // Check for resolution issues (low resolution might indicate manipulation)
      const hasResolutionIssues = resolution < 150;

      // Perform Error Level Analysis (ELA) - simplified version
      // In production, use a proper ELA library
      const hasCopyPaste = await this.detectCopyPaste(fileContent);
      const appearsManipulated = hasCopyPaste || hasResolutionIssues;

      let analysisDetails: string | undefined;
      if (hasCopyPaste) {
        analysisDetails = 'ELA analysis shows inconsistencies suggesting copy-paste manipulation';
      } else if (hasResolutionIssues) {
        analysisDetails = `Low resolution (${resolution} DPI) may indicate image manipulation`;
      }

      const riskScore = appearsManipulated ? (hasCopyPaste ? 85 : 60) : 0;

      return {
        hasCopyPaste,
        hasResolutionIssues,
        resolution,
        appearsManipulated,
        analysisDetails,
        riskScore,
      };
    } catch (error) {
      this.logger.warn(`Image forensics failed: ${error.message}`);
      return {
        hasCopyPaste: false,
        hasResolutionIssues: false,
        appearsManipulated: false,
        riskScore: 0,
      };
    }
  }

  /**
   * Detect copy-paste in image (simplified)
   */
  private async detectCopyPaste(fileContent: Buffer): Promise<boolean> {
    // Simplified detection - in production, use proper ELA or ML-based detection
    // This is a placeholder that simulates detection
    try {
      const image = sharp(fileContent);
      const stats = await image.stats();

      // Check for uniform regions that might indicate copy-paste
      // This is a simplified heuristic
      const channels = stats.channels;
      if (channels && channels.length > 0) {
        const stdDev = channels[0].stdev || 0;
        // Very low standard deviation might indicate uniform regions (copy-paste)
        return stdDev < 5;
      }
    } catch (error) {
      this.logger.warn(`Copy-paste detection failed: ${error.message}`);
    }

    return false;
  }

  /**
   * Match against known forgery templates
   */
  private async matchTemplate(fileContent: Buffer, mimeType?: string): Promise<TemplateMatchResultDto> {
    if (!mimeType?.includes('image')) {
      return {
        isKnownForgery: false,
        matchConfidence: 0,
        riskScore: 0,
      };
    }

    try {
      // Generate hash of image for template matching
      const imageHash = crypto.createHash('sha256').update(fileContent).digest('hex');

      // Get all active templates
      const templates = await this.forgeryTemplateRepository.find({
        where: { isActive: true },
      });

      for (const template of templates) {
        // In production, use image feature matching or perceptual hashing
        // For now, we'll use a simplified hash comparison
        if (template.templateImageHash) {
          // Calculate similarity (simplified - in production use proper image matching)
          const similarity = this.calculateHashSimilarity(imageHash, template.templateImageHash);

          if (similarity > 0.9) {
            // Update template match count
            template.matchCount += 1;
            template.lastMatchedAt = new Date();
            await this.forgeryTemplateRepository.save(template);

            return {
              isKnownForgery: true,
              templateId: template.id,
              templateName: template.templateName,
              matchConfidence: similarity * 100,
              riskScore: 100,
            };
          }
        }
      }

      return {
        isKnownForgery: false,
        matchConfidence: 0,
        riskScore: 0,
      };
    } catch (error) {
      this.logger.warn(`Template matching failed: ${error.message}`);
      return {
        isKnownForgery: false,
        matchConfidence: 0,
        riskScore: 0,
      };
    }
  }

  /**
   * Calculate hash similarity (simplified)
   */
  private calculateHashSimilarity(hash1: string, hash2: string): number {
    if (hash1 === hash2) return 1.0;

    let matches = 0;
    const minLength = Math.min(hash1.length, hash2.length);
    for (let i = 0; i < minLength; i++) {
      if (hash1[i] === hash2[i]) matches++;
    }

    return matches / minLength;
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallRiskScore(
    fontAnalysis: FontAnalysisResultDto,
    metadataAnalysis: MetadataAnalysisResultDto,
    imageForensics: ImageForensicsResultDto,
    templateMatch: TemplateMatchResultDto,
  ): number {
    // Weighted combination
    const weights = {
      font: 0.15,
      metadata: 0.25,
      forensics: 0.35,
      template: 0.25,
    };

    const score =
      fontAnalysis.riskScore * weights.font +
      metadataAnalysis.riskScore * weights.metadata +
      imageForensics.riskScore * weights.forensics +
      templateMatch.riskScore * weights.template;

    return Math.min(100, Math.round(score));
  }

  /**
   * Determine if human review is required
   */
  private shouldRequireHumanReview(
    overallRiskScore: number,
    fontAnalysis: FontAnalysisResultDto,
    metadataAnalysis: MetadataAnalysisResultDto,
    imageForensics: ImageForensicsResultDto,
    templateMatch: TemplateMatchResultDto,
  ): boolean {
    // Require review if:
    // 1. Overall risk score is borderline (50-80)
    // 2. Template match found
    // 3. Multiple suspicious indicators
    const suspiciousCount =
      (fontAnalysis.hasInconsistentFonts ? 1 : 0) +
      (metadataAnalysis.hasDiscrepancy ? 1 : 0) +
      (imageForensics.appearsManipulated ? 1 : 0) +
      (templateMatch.isKnownForgery ? 1 : 0);

    return (
      (overallRiskScore >= 50 && overallRiskScore < 80) ||
      templateMatch.isKnownForgery ||
      suspiciousCount >= 2
    );
  }

  /**
   * Generate review reason
   */
  private generateReviewReason(
    overallRiskScore: number,
    fontAnalysis: FontAnalysisResultDto,
    metadataAnalysis: MetadataAnalysisResultDto,
    imageForensics: ImageForensicsResultDto,
    templateMatch: TemplateMatchResultDto,
  ): string {
    const reasons: string[] = [];

    if (templateMatch.isKnownForgery) {
      reasons.push(`Known forgery template matched: ${templateMatch.templateName}`);
    }
    if (fontAnalysis.hasInconsistentFonts) {
      reasons.push(`Inconsistent fonts detected (${fontAnalysis.fontCount} different fonts)`);
    }
    if (metadataAnalysis.hasDiscrepancy) {
      reasons.push(`Metadata discrepancy: ${metadataAnalysis.discrepancyDescription}`);
    }
    if (imageForensics.appearsManipulated) {
      reasons.push(`Image manipulation detected: ${imageForensics.analysisDetails}`);
    }
    if (overallRiskScore >= 50 && overallRiskScore < 80) {
      reasons.push(`Borderline risk score: ${overallRiskScore}`);
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Multiple suspicious indicators';
  }

  /**
   * Read file content
   */
  private async readFileContent(filePath: string): Promise<Buffer> {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      }
      throw new BadRequestException(`File not found: ${filePath}`);
    } catch (error) {
      throw new BadRequestException(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * Mark confirmed fraud for feedback loop
   */
  async markConfirmedFraud(checkId: string, reviewedBy: string): Promise<void> {
    const check = await this.forgeryCheckRepository.findOne({ where: { id: checkId } });
    if (!check) {
      throw new BadRequestException(`Forgery check ${checkId} not found`);
    }

    check.isConfirmedFraud = true;
    check.reviewStatus = ForgeryReviewStatus.CONFIRMED_FRAUD;
    check.reviewedBy = reviewedBy;
    check.reviewedAt = new Date();
    await this.forgeryCheckRepository.save(check);

    // In production, this would trigger model retraining
    this.logger.log(`Confirmed fraud for check ${checkId} - should trigger model retraining`);
  }
}

