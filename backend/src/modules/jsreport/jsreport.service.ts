import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as jsreport from 'jsreport-core';
import * as jsreportChromePdf from 'jsreport-chrome-pdf';
import * as jsreportHandlebars from 'jsreport-handlebars';
import * as jsreportExpress from 'jsreport-express';

export interface JsReportRenderRequest {
  template: {
    content: string;
    engine?: 'handlebars' | 'jsrender' | 'none';
    recipe?: 'chrome-pdf' | 'html' | 'xlsx' | 'pptx';
    chrome?: {
      format?: 'A4' | 'Letter' | 'A3' | 'A5';
      orientation?: 'portrait' | 'landscape';
      margin?: string;
      displayHeaderFooter?: boolean;
      headerTemplate?: string;
      footerTemplate?: string;
    };
  };
  data?: Record<string, any>;
  options?: {
    timeout?: number;
  };
}

export interface JsReportTemplate {
  name: string;
  content: string;
  engine?: string;
  recipe?: string;
  chrome?: Record<string, any>;
  helpers?: string;
}

@Injectable()
export class JsReportService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JsReportService.name);
  private jsreportInstance: jsreport.Reporter;

  async onModuleInit() {
    try {
      this.jsreportInstance = jsreport({
        extensions: {
          express: {
            enabled: false, // We'll handle HTTP separately
          },
        },
      });

      // Register extensions
      this.jsreportInstance.use(jsreportChromePdf());
      this.jsreportInstance.use(jsreportHandlebars());
      this.jsreportInstance.use(jsreportExpress());

      // Initialize jsreport
      await this.jsreportInstance.init();

      this.logger.log('jsReport initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize jsReport: ${error.message}`, error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.jsreportInstance) {
      try {
        await this.jsreportInstance.close();
        this.logger.log('jsReport closed successfully');
      } catch (error) {
        this.logger.error(`Error closing jsReport: ${error.message}`, error.stack);
      }
    }
  }

  /**
   * Render a report from a template and data
   */
  async renderReport(request: JsReportRenderRequest): Promise<Buffer> {
    try {
      const renderRequest: any = {
        template: {
          content: request.template.content,
          engine: request.template.engine || 'handlebars',
          recipe: request.template.recipe || 'chrome-pdf',
          ...(request.template.chrome && { chrome: request.template.chrome }),
        },
        data: request.data || {},
        options: {
          timeout: request.options?.timeout || 30000,
        },
      };

      const result = await this.jsreportInstance.render(renderRequest);
      return result.content;
    } catch (error) {
      this.logger.error(`Report rendering failed: ${error.message}`, error.stack);
      throw new Error(`Failed to render report: ${error.message}`);
    }
  }

  /**
   * Render PDF report
   */
  async renderPdf(
    templateContent: string,
    data: Record<string, any> = {},
    options: {
      format?: 'A4' | 'Letter' | 'A3' | 'A5';
      orientation?: 'portrait' | 'landscape';
      margin?: string;
      displayHeaderFooter?: boolean;
      headerTemplate?: string;
      footerTemplate?: string;
    } = {},
  ): Promise<Buffer> {
    return this.renderReport({
      template: {
        content: templateContent,
        engine: 'handlebars',
        recipe: 'chrome-pdf',
        chrome: {
          format: options.format || 'A4',
          orientation: options.orientation || 'portrait',
          margin: options.margin || '1cm',
          displayHeaderFooter: options.displayHeaderFooter || false,
          headerTemplate: options.headerTemplate,
          footerTemplate: options.footerTemplate,
        },
      },
      data,
    });
  }

  /**
   * Render HTML report
   */
  async renderHtml(templateContent: string, data: Record<string, any> = {}): Promise<string> {
    const result = await this.renderReport({
      template: {
        content: templateContent,
        engine: 'handlebars',
        recipe: 'html',
      },
      data,
    });

    return result.toString('utf-8');
  }

  /**
   * Render Excel report
   */
  async renderExcel(
    templateContent: string,
    data: Record<string, any> = {},
  ): Promise<Buffer> {
    return this.renderReport({
      template: {
        content: templateContent,
        engine: 'handlebars',
        recipe: 'xlsx',
      },
      data,
    });
  }

  /**
   * Get jsReport instance (for advanced usage)
   */
  getInstance(): jsreport.Reporter {
    return this.jsreportInstance;
  }

  /**
   * Validate template syntax
   */
  async validateTemplate(templateContent: string, engine: string = 'handlebars'): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    try {
      // Try to compile the template
      await this.renderReport({
        template: {
          content: templateContent,
          engine: engine as any,
          recipe: 'html',
        },
        data: {},
      });

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
      };
    }
  }
}

