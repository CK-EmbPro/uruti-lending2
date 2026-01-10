import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

export interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'image/png' | 'image/jpeg' | 'image/webp' | 'svg';
  quality?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  width?: number;
  scale?: number;
}

export interface QRCodeResult {
  dataUrl: string;
  buffer?: Buffer;
  size?: number;
}

@Injectable()
export class QRCodeService {
  private readonly logger = new Logger(QRCodeService.name);

  /**
   * Generate QR code as data URL (base64)
   */
  async generateDataURL(
    data: string,
    options: QRCodeOptions = {},
  ): Promise<string> {
    try {
      const qrOptions: QRCode.QRCodeToDataURLOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        type: (options.type === 'svg' ? 'image/png' : (options.type || 'image/png')) as 'image/png' | 'image/jpeg' | 'image/webp',
        margin: options.margin ?? 1,
        color: options.color || {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: options.width || 300,
      };

      const dataUrl = await QRCode.toDataURL(data, qrOptions);
      this.logger.debug(`QR code generated: ${data.length} characters`);
      return dataUrl;
    } catch (error) {
      this.logger.error(`Failed to generate QR code: ${error.message}`, error.stack);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Generate QR code as buffer
   */
  async generateBuffer(
    data: string,
    options: QRCodeOptions = {},
  ): Promise<Buffer> {
    try {
      const qrOptions: QRCode.QRCodeToBufferOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        type: 'png',
        margin: options.margin ?? 1,
        color: options.color || {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: options.width || 300,
      };

      const buffer = await QRCode.toBuffer(data, qrOptions);
      this.logger.debug(`QR code buffer generated: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to generate QR code buffer: ${error.message}`, error.stack);
      throw new Error(`Failed to generate QR code buffer: ${error.message}`);
    }
  }

  /**
   * Generate QR code with both data URL and buffer
   */
  async generate(
    data: string,
    options: QRCodeOptions = {},
  ): Promise<QRCodeResult> {
    const [dataUrl, buffer] = await Promise.all([
      this.generateDataURL(data, options),
      this.generateBuffer(data, options),
    ]);

    return {
      dataUrl,
      buffer,
      size: buffer.length,
    };
  }

  /**
   * Generate QR code for URL
   */
  async generateForUrl(url: string, options: QRCodeOptions = {}): Promise<QRCodeResult> {
    return this.generate(url, options);
  }

  /**
   * Generate QR code for text
   */
  async generateForText(text: string, options: QRCodeOptions = {}): Promise<QRCodeResult> {
    return this.generate(text, options);
  }

  /**
   * Generate QR code for payment link
   */
  async generateForPayment(
    paymentData: {
      amount: number;
      currency: string;
      reference: string;
      merchant?: string;
    },
    options: QRCodeOptions = {},
  ): Promise<QRCodeResult> {
    // Generate payment QR code data (can be customized based on payment provider)
    const paymentString = `PAYMENT:${paymentData.amount}:${paymentData.currency}:${paymentData.reference}${paymentData.merchant ? `:${paymentData.merchant}` : ''}`;
    return this.generate(paymentString, options);
  }

  /**
   * Generate QR code for loan document
   */
  async generateForLoanDocument(
    loanId: string,
    documentId: string,
    baseUrl?: string,
  ): Promise<QRCodeResult> {
    const url = baseUrl
      ? `${baseUrl}/loans/${loanId}/documents/${documentId}`
      : `LOAN:${loanId}:DOC:${documentId}`;
    return this.generate(url, {
      errorCorrectionLevel: 'H', // High error correction for important documents
      width: 400,
    });
  }

  /**
   * Generate QR code for customer portal link
   */
  async generateForCustomerPortal(
    userId: string,
    token: string,
    baseUrl?: string,
  ): Promise<QRCodeResult> {
    const url = baseUrl
      ? `${baseUrl}/portal/login?token=${token}`
      : `PORTAL:${userId}:${token}`;
    return this.generate(url, {
      errorCorrectionLevel: 'M',
      width: 300,
    });
  }

  /**
   * Generate QR code for report download
   */
  async generateForReport(
    reportId: string,
    downloadUrl: string,
  ): Promise<QRCodeResult> {
    return this.generate(downloadUrl, {
      errorCorrectionLevel: 'M',
      width: 300,
    });
  }

  /**
   * Validate QR code data
   */
  validateData(data: string): { valid: boolean; error?: string } {
    if (!data || data.trim().length === 0) {
      return { valid: false, error: 'QR code data cannot be empty' };
    }

    if (data.length > 2953) {
      // QR code v40 maximum capacity for alphanumeric
      return { valid: false, error: 'QR code data is too long (max 2953 characters)' };
    }

    return { valid: true };
  }
}

