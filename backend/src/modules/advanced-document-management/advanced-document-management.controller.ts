import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdvancedDocumentManagementService } from './services/advanced-document-management.service';
import {
  BulkDocumentOperationDto,
  ShareDocumentDto,
  DocumentSearchDto,
} from './dto/advanced-document-management.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('advanced-document-management')
@ApiBearerAuth('JWT-auth')
@Controller('advanced-document-management')
@UseGuards(CompanyGuard)
export class AdvancedDocumentManagementController {
  constructor(
    private readonly documentService: AdvancedDocumentManagementService,
  ) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search documents',
    description: 'Advanced document search with support for query, category, file type, tags, and date range filtering.',
  })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'category', required: false, enum: ['LOAN_APPLICATION', 'LOAN_DOCUMENT', 'CUSTOMER_DOCUMENT', 'COMPLIANCE', 'CONTRACT', 'STATEMENT', 'OTHER'] })
  @ApiQuery({ name: 'fileType', required: false, description: 'File MIME type' })
  @ApiQuery({ name: 'tags', required: false, description: 'Comma-separated tags' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
  })
  async searchDocuments(
    @Query() query: any,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    // Handle tags as string (from query params) and convert to array
    if (query.tags && typeof query.tags === 'string') {
      query.tags = query.tags.split(',');
    }
    return await this.documentService.searchDocuments(query as DocumentSearchDto, companyId);
  }

  @Post('documents/:id/share')
  @ApiOperation({
    summary: 'Share document',
    description: 'Shares a document with specified users. Supports access levels, expiry dates, and download permissions.',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({ type: ShareDocumentDto })
  @ApiResponse({
    status: 200,
    description: 'Document shared successfully',
  })
  async shareDocument(
    @Param('id') id: string,
    @Body() dto: ShareDocumentDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const sharedBy = req.user?.id || req.userId;
    dto.documentId = id;
    await this.documentService.shareDocument(dto, companyId, sharedBy);
    return { message: 'Document shared successfully' };
  }

  @Post('documents/:id/versions')
  @ApiOperation({
    summary: 'Add document version',
    description: 'Adds a new version to a document. Maintains version history with change descriptions.',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', example: '/documents/v2/file.pdf' },
        fileSize: { type: 'number', example: 1048576 },
        changeDescription: { type: 'string', example: 'Updated terms' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document version added successfully',
  })
  async addDocumentVersion(
    @Param('id') id: string,
    @Body() body: { filePath: string; fileSize: number; changeDescription: string },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const createdBy = req.user?.id || req.userId;
    return await this.documentService.addDocumentVersion(
      id,
      body.filePath,
      body.fileSize,
      body.changeDescription,
      companyId,
      createdBy,
    );
  }

  @Patch('documents/:id/tags')
  @ApiOperation({
    summary: 'Tag document',
    description: 'Adds tags to a document for better organization and searchability.',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string' }, example: ['important', 'contract'] },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Document tagged successfully',
  })
  async tagDocument(
    @Param('id') id: string,
    @Body() body: { tags: string[] },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.documentService.tagDocument(id, body.tags, companyId);
    return { message: 'Document tagged successfully' };
  }

  @Post('documents/bulk')
  @ApiOperation({
    summary: 'Bulk document operations',
    description: 'Performs bulk operations on multiple documents (delete, archive, tag, share, download).',
  })
  @ApiBody({ type: BulkDocumentOperationDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed',
  })
  async bulkDocumentOperation(
    @Body() dto: BulkDocumentOperationDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.documentService.bulkDocumentOperation(dto, companyId);
  }

  @Patch('documents/:id/archive')
  @ApiOperation({
    summary: 'Archive document',
    description: 'Archives a document. Archived documents are hidden from normal search but can be restored.',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document archived successfully',
  })
  async archiveDocument(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.documentService.archiveDocument(id, companyId);
    return { message: 'Document archived successfully' };
  }

  @Get('documents/:id')
  @ApiOperation({
    summary: 'Get document metadata',
    description: 'Returns comprehensive document metadata including versions, sharing information, and tags.',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document metadata retrieved successfully',
  })
  async getDocumentMetadata(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.documentService.getDocumentMetadata(id, companyId);
  }
}

