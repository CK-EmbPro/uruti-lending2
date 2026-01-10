import { Injectable, Logger } from '@nestjs/common';
import JsBarcode from 'jsbarcode';
// @ts-ignore - canvas package may not be installed, using alternative approach
// import { createCanvas } from 'canvas';

export interface BarcodeOptions {
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14' | 'MSI' | 'pharmacode' | 'codabar';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  textMargin?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
}

@Injectable()
export class BarcodeService {
  private readonly logger = new Logger(BarcodeService.name);

  /**
   * Generate barcode as data URL
   */
  async generateDataURL(
    data: string,
    options: BarcodeOptions = {},
  ): Promise<string> {
    try {
      // @ts-ignore - canvas package needs to be installed: npm install canvas
      const canvas = createCanvas(200, 100);
      const ctx = canvas.getContext('2d');

      JsBarcode(canvas, data, {
        format: options.format || 'CODE128',
        width: options.width || 2,
        height: options.height || 100,
        displayValue: options.displayValue !== false,
        fontSize: options.fontSize || 20,
        textMargin: options.textMargin || 2,
        margin: options.margin || 10,
        background: options.background || '#ffffff',
        lineColor: options.lineColor || '#000000',
      });

      const dataUrl = canvas.toDataURL('image/png');
      this.logger.debug(`Barcode generated: ${data}`);
      return dataUrl;
    } catch (error) {
      this.logger.error(`Failed to generate barcode: ${error.message}`, error.stack);
      throw new Error(`Failed to generate barcode: ${error.message}`);
    }
  }

  /**
   * Generate barcode as buffer
   */
  async generateBuffer(
    data: string,
    options: BarcodeOptions = {},
  ): Promise<Buffer> {
    try {
      // @ts-ignore - canvas package needs to be installed: npm install canvas
      const canvas = createCanvas(200, 100);
      const ctx = canvas.getContext('2d');

      JsBarcode(canvas, data, {
        format: options.format || 'CODE128',
        width: options.width || 2,
        height: options.height || 100,
        displayValue: options.displayValue !== false,
        fontSize: options.fontSize || 20,
        textMargin: options.textMargin || 2,
        margin: options.margin || 10,
        background: options.background || '#ffffff',
        lineColor: options.lineColor || '#000000',
      });

      const buffer = canvas.toBuffer('image/png');
      this.logger.debug(`Barcode buffer generated: ${data}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to generate barcode buffer: ${error.message}`, error.stack);
      throw new Error(`Failed to generate barcode buffer: ${error.message}`);
    }
  }

  /**
   * Generate barcode for loan document
   */
  async generateForLoan(loanId: string): Promise<Buffer> {
    return this.generateBuffer(`LOAN-${loanId}`, {
      format: 'CODE128',
      height: 80,
      displayValue: true,
    });
  }

  /**
   * Generate barcode for document
   */
  async generateForDocument(documentId: string): Promise<Buffer> {
    return this.generateBuffer(`DOC-${documentId}`, {
      format: 'CODE128',
      height: 80,
      displayValue: true,
    });
  }
}

