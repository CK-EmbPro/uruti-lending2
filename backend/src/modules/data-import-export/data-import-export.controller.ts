import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DataImportExportService } from './services/data-import-export.service';
import {
  ImportDataDto,
  ExportDataDto,
  BulkOperationDto,
  ImportType,
} from './dto/data-import-export.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('data-import-export')
@ApiBearerAuth('JWT-auth')
@Controller('data-import-export')
@UseGuards(CompanyGuard)
export class DataImportExportController {
  constructor(private readonly importExportService: DataImportExportService) {}

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Import data from file',
    description: 'Imports data from CSV or Excel file. Supports field mapping, validation, and error reporting.',
  })
  @ApiBody({ type: ImportDataDto })
  @ApiResponse({
    status: 200,
    description: 'Data imported successfully',
  })
  async importData(
    @Body() dto: ImportDataDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.importExportService.importData(dto, companyId);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export data',
    description: 'Exports data in CSV, Excel, JSON, or PDF format with optional filtering and field selection.',
  })
  @ApiBody({ type: ExportDataDto })
  @ApiResponse({
    status: 200,
    description: 'Data exported successfully',
  })
  async exportData(
    @Body() dto: ExportDataDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.importExportService.exportData(dto, companyId);
  }

  @Post('bulk-operation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perform bulk operation',
    description: 'Performs bulk operations on multiple entities (e.g., bulk status update, bulk delete).',
  })
  @ApiBody({ type: BulkOperationDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed successfully',
  })
  async performBulkOperation(
    @Body() dto: BulkOperationDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.importExportService.performBulkOperation(dto, companyId);
  }

  @Get('import-template/:importType')
  @ApiOperation({
    summary: 'Get import template',
    description: 'Returns import template file and field definitions for a specific import type.',
  })
  @ApiParam({ name: 'importType', enum: ImportType, description: 'Import type' })
  @ApiResponse({
    status: 200,
    description: 'Import template retrieved successfully',
  })
  async getImportTemplate(
    @Param('importType') importType: ImportType,
  ) {
    return await this.importExportService.getImportTemplate(importType);
  }
}

