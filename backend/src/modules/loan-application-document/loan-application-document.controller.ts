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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoanApplicationDocumentService } from './loan-application-document.service';
import { CreateLoanApplicationDocumentDto } from './dto/create-loan-application-document.dto';
import { UpdateLoanApplicationDocumentDto } from './dto/update-loan-application-document.dto';

@ApiTags('loan-application-documents')
@ApiBearerAuth('JWT-auth')
@Controller('loan-application-documents')
export class LoanApplicationDocumentController {
  constructor(
    private readonly documentService: LoanApplicationDocumentService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new loan application document',
    description: 'Uploads a document for a loan application',
  })
  @ApiBody({ type: CreateLoanApplicationDocumentDto })
  @ApiResponse({
    status: 201,
    description: 'Document created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createDto: CreateLoanApplicationDocumentDto) {
    return this.documentService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all loan application documents',
    description: 'Retrieves a list of all loan application documents',
  })
  @ApiResponse({
    status: 200,
    description: 'List of documents retrieved successfully',
  })
  findAll() {
    return this.documentService.findAll();
  }

  @Get('application/:applicationId')
  @ApiOperation({
    summary: 'Get documents by application ID',
    description: 'Retrieves all documents for a specific loan application',
  })
  @ApiParam({ name: 'applicationId', description: 'Application UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
  })
  findByApplication(@Param('applicationId') applicationId: string) {
    return this.documentService.findByApplicationId(applicationId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get document by ID',
    description: 'Retrieves a specific document by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Document UUID', type: String })
  @ApiResponse({ status: 200, description: 'Document found' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update document',
    description: 'Updates an existing document (cannot update verified documents)',
  })
  @ApiParam({ name: 'id', description: 'Document UUID', type: String })
  @ApiBody({ type: UpdateLoanApplicationDocumentDto })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 400, description: 'Cannot update verified document' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLoanApplicationDocumentDto,
  ) {
    return this.documentService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Permanently deletes a document (cannot delete verified documents)',
  })
  @ApiParam({ name: 'id', description: 'Document UUID', type: String })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete verified document' })
  remove(@Param('id') id: string) {
    return this.documentService.remove(id);
  }

  @Post(':id/verify')
  @ApiOperation({
    summary: 'Verify document',
    description: 'Marks a document as verified',
  })
  @ApiParam({ name: 'id', description: 'Document UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        verifiedBy: { type: 'string', description: 'User ID who verified' },
        remarks: { type: 'string', description: 'Verification remarks' },
      },
      required: ['verifiedBy'],
    },
  })
  @ApiResponse({ status: 200, description: 'Document verified successfully' })
  @ApiResponse({ status: 400, description: 'Document cannot be verified' })
  verify(
    @Param('id') id: string,
    @Body() body: { verifiedBy: string; remarks?: string },
  ) {
    return this.documentService.verify(id, body.verifiedBy, body.remarks);
  }

  @Post(':id/reject')
  @ApiOperation({
    summary: 'Reject document',
    description: 'Marks a document as rejected',
  })
  @ApiParam({ name: 'id', description: 'Document UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        verifiedBy: { type: 'string', description: 'User ID who rejected' },
        rejectionReason: {
          type: 'string',
          description: 'Reason for rejection',
        },
      },
      required: ['verifiedBy', 'rejectionReason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Document rejected successfully' })
  @ApiResponse({ status: 400, description: 'Document cannot be rejected' })
  reject(
    @Param('id') id: string,
    @Body() body: { verifiedBy: string; rejectionReason: string },
  ) {
    return this.documentService.reject(
      id,
      body.verifiedBy,
      body.rejectionReason,
    );
  }

  @Get('application/:applicationId/check-required')
  @ApiOperation({
    summary: 'Check required documents',
    description: 'Checks if all required documents are uploaded and verified',
  })
  @ApiParam({ name: 'applicationId', description: 'Application UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Required documents check completed',
  })
  checkRequired(@Param('applicationId') applicationId: string) {
    return this.documentService.checkRequiredDocuments(applicationId);
  }

  @Get('application/:applicationId/check-expired')
  @ApiOperation({
    summary: 'Check expired documents',
    description: 'Checks and marks expired documents',
  })
  @ApiParam({ name: 'applicationId', description: 'Application UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Expired documents check completed',
  })
  checkExpired(@Param('applicationId') applicationId: string) {
    return this.documentService.checkExpiredDocuments(applicationId);
  }
}

