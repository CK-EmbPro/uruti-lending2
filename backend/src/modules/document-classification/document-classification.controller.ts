import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DocumentClassificationService } from './services/document-classification.service';
import { ClassifyDocumentDto } from './dto/document-classification.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('document-classification')
@ApiBearerAuth('JWT-auth')
@Controller('document-classification')
@UseGuards(CompanyGuard)
export class DocumentClassificationController {
  constructor(
    private readonly classificationService: DocumentClassificationService,
  ) {}

  @Post('classify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Automatically classify document',
    description: 'Uses AI and pattern matching to automatically classify uploaded documents (ID card, bank statement, payslip, etc.)',
  })
  @ApiBody({ type: ClassifyDocumentDto })
  @ApiResponse({
    status: 200,
    description: 'Document classified successfully',
  })
  async classifyDocument(
    @Body() dto: ClassifyDocumentDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.classificationService.classifyDocument(dto, companyId);
  }

  @Post('batch-classify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch classify multiple documents',
    description: 'Classifies multiple documents in a single operation',
  })
  @ApiBody({ type: [ClassifyDocumentDto] })
  @ApiResponse({
    status: 200,
    description: 'Documents classified successfully',
  })
  async batchClassify(
    @Body() documents: ClassifyDocumentDto[],
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.classificationService.batchClassify(documents, companyId);
  }
}

