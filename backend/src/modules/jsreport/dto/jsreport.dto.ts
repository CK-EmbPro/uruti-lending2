import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export enum ReportEngine {
  HANDLEBARS = 'handlebars',
  JSRENDER = 'jsrender',
  NONE = 'none',
}

export enum ReportRecipe {
  CHROME_PDF = 'chrome-pdf',
  HTML = 'html',
  XLSX = 'xlsx',
  PPTX = 'pptx',
}

export enum PageFormat {
  A4 = 'A4',
  LETTER = 'Letter',
  A3 = 'A3',
  A5 = 'A5',
}

export enum PageOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

export class RenderReportDto {
  @ApiProperty({
    description: 'Report template content (HTML/Handlebars)',
    example: '<h1>{{title}}</h1><p>{{content}}</p>',
  })
  @IsString()
  templateContent: string;

  @ApiPropertyOptional({
    description: 'Template data (JSON object)',
    example: { title: 'My Report', content: 'Report content here' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Template engine',
    enum: ReportEngine,
    default: ReportEngine.HANDLEBARS,
  })
  @IsOptional()
  @IsEnum(ReportEngine)
  engine?: ReportEngine;

  @ApiPropertyOptional({
    description: 'Output recipe',
    enum: ReportRecipe,
    default: ReportRecipe.CHROME_PDF,
  })
  @IsOptional()
  @IsEnum(ReportRecipe)
  recipe?: ReportRecipe;

  @ApiPropertyOptional({
    description: 'Page format (for PDF)',
    enum: PageFormat,
    default: PageFormat.A4,
  })
  @IsOptional()
  @IsEnum(PageFormat)
  format?: PageFormat;

  @ApiPropertyOptional({
    description: 'Page orientation (for PDF)',
    enum: PageOrientation,
    default: PageOrientation.PORTRAIT,
  })
  @IsOptional()
  @IsEnum(PageOrientation)
  orientation?: PageOrientation;

  @ApiPropertyOptional({
    description: 'Page margins (for PDF)',
    example: '1cm',
    default: '1cm',
  })
  @IsOptional()
  @IsString()
  margin?: string;

  @ApiPropertyOptional({
    description: 'Display header and footer (for PDF)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  displayHeaderFooter?: boolean;

  @ApiPropertyOptional({
    description: 'Header template HTML (for PDF)',
    example: '<div style="text-align: center;">Header</div>',
  })
  @IsOptional()
  @IsString()
  headerTemplate?: string;

  @ApiPropertyOptional({
    description: 'Footer template HTML (for PDF)',
    example: '<div style="text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  })
  @IsOptional()
  @IsString()
  footerTemplate?: string;

  @ApiPropertyOptional({
    description: 'Render timeout in milliseconds',
    default: 30000,
  })
  @IsOptional()
  @IsNumber()
  timeout?: number;
}

export class ValidateTemplateDto {
  @ApiProperty({
    description: 'Template content to validate',
    example: '<h1>{{title}}</h1>',
  })
  @IsString()
  templateContent: string;

  @ApiPropertyOptional({
    description: 'Template engine',
    enum: ReportEngine,
    default: ReportEngine.HANDLEBARS,
  })
  @IsOptional()
  @IsEnum(ReportEngine)
  engine?: ReportEngine;
}

export class RenderReportResponse {
  @ApiProperty({
    description: 'Report file content (base64 encoded)',
    example: 'JVBERi0xLjQKJeLjz9MKMy...',
  })
  content: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
  })
  size: number;
}

export class ValidateTemplateResponse {
  @ApiProperty({
    description: 'Whether template is valid',
    example: true,
  })
  valid: boolean;

  @ApiPropertyOptional({
    description: 'Validation errors',
    example: ['Syntax error at line 5'],
  })
  errors?: string[];
}

