import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JsReportService } from './jsreport.service';
import {
  RenderReportDto,
  ValidateTemplateDto,
  RenderReportResponse,
  ValidateTemplateResponse,
  ReportRecipe,
} from './dto/jsreport.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('jsReport - Report Designer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jsreport')
export class JsReportController {
  constructor(private readonly jsReportService: JsReportService) {}

  @Post('render')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Render a report from template' })
  @ApiResponse({
    status: 200,
    description: 'Report rendered successfully',
    type: RenderReportResponse,
  })
  async renderReport(
    @Body() dto: RenderReportDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      let result: Buffer;
      let mimeType: string;
      let filename: string;

      switch (dto.recipe || ReportRecipe.CHROME_PDF) {
        case ReportRecipe.CHROME_PDF:
          result = await this.jsReportService.renderPdf(
            dto.templateContent,
            dto.data || {},
            {
              format: dto.format,
              orientation: dto.orientation,
              margin: dto.margin,
              displayHeaderFooter: dto.displayHeaderFooter,
              headerTemplate: dto.headerTemplate,
              footerTemplate: dto.footerTemplate,
            },
          );
          mimeType = 'application/pdf';
          filename = 'report.pdf';
          break;

        case ReportRecipe.HTML:
          const htmlContent = await this.jsReportService.renderHtml(
            dto.templateContent,
            dto.data || {},
          );
          result = Buffer.from(htmlContent, 'utf-8');
          mimeType = 'text/html';
          filename = 'report.html';
          break;

        case ReportRecipe.XLSX:
          result = await this.jsReportService.renderExcel(
            dto.templateContent,
            dto.data || {},
          );
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = 'report.xlsx';
          break;

        default:
          throw new Error(`Unsupported recipe: ${dto.recipe}`);
      }

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', result.length.toString());
      res.send(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  @Post('render/base64')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Render a report and return as base64' })
  @ApiResponse({
    status: 200,
    description: 'Report rendered successfully',
    type: RenderReportResponse,
  })
  async renderReportBase64(@Body() dto: RenderReportDto): Promise<RenderReportResponse> {
    let result: Buffer;
    let mimeType: string;

    switch (dto.recipe || ReportRecipe.CHROME_PDF) {
      case ReportRecipe.CHROME_PDF:
        result = await this.jsReportService.renderPdf(
          dto.templateContent,
          dto.data || {},
          {
            format: dto.format,
            orientation: dto.orientation,
            margin: dto.margin,
            displayHeaderFooter: dto.displayHeaderFooter,
            headerTemplate: dto.headerTemplate,
            footerTemplate: dto.footerTemplate,
          },
        );
        mimeType = 'application/pdf';
        break;

      case ReportRecipe.HTML:
        const htmlContent = await this.jsReportService.renderHtml(
          dto.templateContent,
          dto.data || {},
        );
        result = Buffer.from(htmlContent, 'utf-8');
        mimeType = 'text/html';
        break;

      case ReportRecipe.XLSX:
        result = await this.jsReportService.renderExcel(
          dto.templateContent,
          dto.data || {},
        );
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      default:
        throw new Error(`Unsupported recipe: ${dto.recipe}`);
    }

    return {
      content: result.toString('base64'),
      mimeType,
      size: result.length,
    };
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate template syntax' })
  @ApiResponse({
    status: 200,
    description: 'Template validation result',
    type: ValidateTemplateResponse,
  })
  async validateTemplate(
    @Body() dto: ValidateTemplateDto,
  ): Promise<ValidateTemplateResponse> {
    return this.jsReportService.validateTemplate(
      dto.templateContent,
      dto.engine || 'handlebars',
    );
  }

  @Get('health')
  @ApiOperation({ summary: 'Check jsReport service health' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async healthCheck(): Promise<{ status: string; version?: string }> {
    return {
      status: 'ok',
      version: '3.0.0',
    };
  }
}

