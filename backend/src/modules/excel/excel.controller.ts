import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ExcelService } from './excel.service';
import {
  ExportToExcelDto,
  ImportFromExcelDto,
  ExportToCSVDto,
  ImportFromCSVDto,
} from './dto/excel.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Excel & CSV')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export data to Excel' })
  @ApiResponse({
    status: 200,
    description: 'Excel file generated successfully',
  })
  async exportToExcel(@Body() dto: ExportToExcelDto, @Res() res: Response): Promise<void> {
    try {
      const buffer = await this.excelService.generateExcel(dto.data, {
        filename: dto.filename,
        sheetName: dto.sheetName,
        headers: dto.headers,
      });

      const filename = dto.filename || 'export.xlsx';
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import data from Excel' })
  @ApiResponse({
    status: 200,
    description: 'Excel file parsed successfully',
  })
  async importFromExcel(@Body() dto: ImportFromExcelDto): Promise<{ data: any[]; count: number }> {
    const buffer = Buffer.from(dto.fileData, 'base64');
    const data = await this.excelService.parseExcel(buffer, {
      sheetIndex: dto.sheetIndex,
      startRow: dto.startRow,
      headers: dto.headers,
      skipEmptyRows: dto.skipEmptyRows,
    });

    return {
      data,
      count: data.length,
    };
  }

  @Post('export-csv')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export data to CSV' })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
  })
  async exportToCSV(@Body() dto: ExportToCSVDto, @Res() res: Response): Promise<void> {
    try {
      const csvContent = await this.excelService.generateCSV(dto.data, dto.headers);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
      res.setHeader('Content-Length', csvContent.length.toString());
      res.send(csvContent);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  @Post('import-csv')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import data from CSV' })
  @ApiResponse({
    status: 200,
    description: 'CSV file parsed successfully',
  })
  async importFromCSV(@Body() dto: ImportFromCSVDto): Promise<{ data: any[]; count: number }> {
    const data = await this.excelService.parseCSV(dto.csvContent, dto.headers);

    return {
      data,
      count: data.length,
    };
  }
}

