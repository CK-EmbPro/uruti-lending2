import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { DocumentMetadata, DocumentCategory, DocumentAccessLevel } from '../entities/document-metadata.entity';
import {
  BulkDocumentOperationDto,
  ShareDocumentDto,
  DocumentSearchDto,
  DocumentMetadata as DocumentMetadataDto,
  DocumentVersion,
} from '../dto/advanced-document-management.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdvancedDocumentManagementService {
  private readonly logger = new Logger(AdvancedDocumentManagementService.name);

  constructor(
    @InjectRepository(DocumentMetadata)
    private readonly metadataRepository: Repository<DocumentMetadata>,
  ) {}

  /**
   * Create document metadata
   */
  async createDocumentMetadata(
    documentId: string,
    documentType: string,
    name: string,
    category: DocumentCategory,
    fileType: string,
    fileSize: number,
    companyId: string,
    createdBy: string,
  ): Promise<DocumentMetadataDto> {
    const metadata = this.metadataRepository.create({
      companyId,
      documentId,
      documentType,
      name,
      category,
      fileType,
      fileSize,
      tags: [],
      accessLevel: DocumentAccessLevel.PRIVATE,
      versions: [
        {
          version: 1,
          filePath: '', // Would be set from actual document
          fileSize,
          createdAt: new Date().toISOString(),
          createdBy,
          changeDescription: 'Initial version',
        },
      ],
      sharedWith: [],
      createdBy,
    });

    const saved = await this.metadataRepository.save(metadata);

    return this.mapToDto(saved);
  }

  /**
   * Search documents
   */
  async searchDocuments(
    dto: DocumentSearchDto,
    companyId: string,
  ): Promise<DocumentMetadataDto[]> {
    const where: any = { companyId, archived: false };

    if (dto.category) {
      where.category = dto.category;
    }

    if (dto.fileType) {
      where.fileType = dto.fileType;
    }

    if (dto.tags && dto.tags.length > 0) {
      // TypeORM doesn't support array contains directly, so we'll filter in memory
      // In production, would use proper array query
    }

    let metadata = await this.metadataRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });

    // Filter by query
    if (dto.query) {
      const queryLower = dto.query.toLowerCase();
      metadata = metadata.filter(
        (m) =>
          m.name.toLowerCase().includes(queryLower) ||
          m.tags.some((tag) => tag.toLowerCase().includes(queryLower)),
      );
    }

    // Filter by tags
    if (dto.tags && dto.tags.length > 0) {
      metadata = metadata.filter((m) =>
        dto.tags!.some((tag) => m.tags.includes(tag)),
      );
    }

    return metadata.map((m) => this.mapToDto(m));
  }

  /**
   * Share document
   */
  async shareDocument(
    dto: ShareDocumentDto,
    companyId: string,
    sharedBy: string,
  ): Promise<void> {
    const metadata = await this.metadataRepository.findOne({
      where: { id: dto.documentId, companyId },
    });

    if (!metadata) {
      throw new Error(`Document ${dto.documentId} not found`);
    }

    // Add shared users
    for (const userId of dto.userIds) {
      const existingShare = metadata.sharedWith.find((s) => s.userId === userId);
      if (!existingShare) {
        metadata.sharedWith.push({
          userId,
          accessLevel: dto.accessLevel || DocumentAccessLevel.SHARED,
          expiryDate: dto.expiryDate,
          canDownload: dto.canDownload !== false,
          sharedAt: new Date().toISOString(),
        });
      }
    }

    metadata.accessLevel = DocumentAccessLevel.SHARED;
    await this.metadataRepository.save(metadata);

    this.logger.log(`Document ${dto.documentId} shared with ${dto.userIds.length} users`);
  }

  /**
   * Add document version
   */
  async addDocumentVersion(
    documentId: string,
    filePath: string,
    fileSize: number,
    changeDescription: string,
    companyId: string,
    createdBy: string,
  ): Promise<DocumentVersion> {
    const metadata = await this.metadataRepository.findOne({
      where: { documentId, companyId },
    });

    if (!metadata) {
      throw new Error(`Document ${documentId} not found`);
    }

    const versionNumber = metadata.versions.length + 1;
    const newVersion: DocumentVersion = {
      id: `${metadata.id}-v${versionNumber}`,
      version: versionNumber,
      filePath,
      fileSize,
      createdAt: new Date().toISOString(),
      createdBy,
      changeDescription,
    };

    metadata.versions.push(newVersion);
    metadata.fileSize = fileSize; // Update to latest version size
    await this.metadataRepository.save(metadata);

    return newVersion;
  }

  /**
   * Tag document
   */
  async tagDocument(
    documentId: string,
    tags: string[],
    companyId: string,
  ): Promise<void> {
    const metadata = await this.metadataRepository.findOne({
      where: { documentId, companyId },
    });

    if (!metadata) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Add new tags (avoid duplicates)
    for (const tag of tags) {
      if (!metadata.tags.includes(tag)) {
        metadata.tags.push(tag);
      }
    }

    await this.metadataRepository.save(metadata);
  }

  /**
   * Bulk document operations
   */
  async bulkDocumentOperation(
    dto: BulkDocumentOperationDto,
    companyId: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const metadata = await this.metadataRepository.find({
      where: { id: In(dto.documentIds), companyId },
    });

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const meta of metadata) {
      try {
        switch (dto.operation) {
          case 'DELETE':
            await this.metadataRepository.remove(meta);
            break;
          case 'ARCHIVE':
            meta.archived = true;
            meta.archivedAt = new Date();
            await this.metadataRepository.save(meta);
            break;
          case 'TAG':
            if (dto.parameters?.tags) {
              await this.tagDocument(meta.documentId, dto.parameters.tags, companyId);
            }
            break;
          case 'SHARE':
            if (dto.parameters?.userIds) {
              await this.shareDocument(
                {
                  documentId: meta.id,
                  userIds: dto.parameters.userIds,
                  accessLevel: dto.parameters.accessLevel,
                } as ShareDocumentDto,
                companyId,
                'system',
              );
            }
            break;
        }
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`${meta.id}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }

  /**
   * Archive document
   */
  async archiveDocument(
    documentId: string,
    companyId: string,
  ): Promise<void> {
    const metadata = await this.metadataRepository.findOne({
      where: { documentId, companyId },
    });

    if (!metadata) {
      throw new Error(`Document ${documentId} not found`);
    }

    metadata.archived = true;
    metadata.archivedAt = new Date();
    await this.metadataRepository.save(metadata);
  }

  /**
   * Get document metadata
   */
  async getDocumentMetadata(
    documentId: string,
    companyId: string,
  ): Promise<DocumentMetadataDto> {
    const metadata = await this.metadataRepository.findOne({
      where: { documentId, companyId },
    });

    if (!metadata) {
      throw new Error(`Document ${documentId} not found`);
    }

    return this.mapToDto(metadata);
  }

  // Private helper methods

  private mapToDto(metadata: DocumentMetadata): DocumentMetadataDto {
    return {
      id: metadata.id,
      name: metadata.name,
      category: metadata.category,
      fileType: metadata.fileType,
      fileSize: metadata.fileSize,
      tags: metadata.tags,
      accessLevel: metadata.accessLevel,
      versions: metadata.versions.map((v) => ({
        id: `${metadata.id}-v${v.version}`,
        version: v.version,
        filePath: v.filePath,
        fileSize: v.fileSize,
        createdAt: v.createdAt,
        createdBy: v.createdBy,
        changeDescription: v.changeDescription,
      })),
      sharedWith: metadata.sharedWith.map((s) => s.userId),
      createdAt: metadata.createdAt.toISOString(),
      createdBy: metadata.createdBy,
    };
  }
}

