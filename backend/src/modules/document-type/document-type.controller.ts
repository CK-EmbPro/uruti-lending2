import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DocumentTypeService } from './document-type.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@ApiTags('document-types')
@ApiBearerAuth('JWT-auth')
@Controller('document-types')
export class DocumentTypeController {
  constructor(private readonly documentTypeService: DocumentTypeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new document type',
    description: 'Creates a new document type for loan applications',
  })
  @ApiBody({ type: CreateDocumentTypeDto })
  @ApiResponse({
    status: 201,
    description: 'Document type created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createDto: CreateDocumentTypeDto) {
    return this.documentTypeService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all document types',
    description: 'Retrieves a list of all document types',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category',
  })
  @ApiResponse({
    status: 200,
    description: 'List of document types retrieved successfully',
  })
  findAll(
    @Query('active') active?: string,
    @Query('category') category?: string,
  ) {
    if (active === 'true') {
      return this.documentTypeService.findActive();
    }
    if (category) {
      return this.documentTypeService.findByCategory(category);
    }
    return this.documentTypeService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get document type by ID',
    description: 'Retrieves a specific document type by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Document Type UUID', type: String })
  @ApiResponse({ status: 200, description: 'Document type found' })
  @ApiResponse({ status: 404, description: 'Document type not found' })
  findOne(@Param('id') id: string) {
    return this.documentTypeService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Get document type by code',
    description: 'Retrieves a specific document type by its code',
  })
  @ApiParam({ name: 'code', description: 'Document Type Code', type: String })
  @ApiResponse({ status: 200, description: 'Document type found' })
  @ApiResponse({ status: 404, description: 'Document type not found' })
  findByCode(@Param('code') code: string) {
    return this.documentTypeService.findByCode(code);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update document type',
    description: 'Updates an existing document type',
  })
  @ApiParam({ name: 'id', description: 'Document Type UUID', type: String })
  @ApiBody({ type: UpdateDocumentTypeDto })
  @ApiResponse({ status: 200, description: 'Document type updated successfully' })
  @ApiResponse({ status: 404, description: 'Document type not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateDocumentTypeDto) {
    return this.documentTypeService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete document type',
    description: 'Permanently deletes a document type',
  })
  @ApiParam({ name: 'id', description: 'Document Type UUID', type: String })
  @ApiResponse({ status: 204, description: 'Document type deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document type not found' })
  remove(@Param('id') id: string) {
    return this.documentTypeService.remove(id);
  }
}

