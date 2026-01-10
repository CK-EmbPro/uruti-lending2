import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface PDFOptions {
  size?: 'A4' | 'LETTER' | 'A3' | 'A5';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  info?: PDFKit.DocumentInfo;
}

@Injectable()
export class PDFService {
  private readonly logger = new Logger(PDFService.name);

  /**
   * Generate PDF using PDFKit
   */
  async generatePDF(
    content: (doc: PDFKit.PDFDocument) => void,
    options: PDFOptions = {},
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const defaultMargins = {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        };

        const doc = new PDFDocument({
          size: options.size || 'A4',
          layout: options.orientation || 'portrait',
          margins: options.margins || defaultMargins,
          info: options.info,
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          this.logger.debug(`PDF generated: ${buffer.length} bytes`);
          resolve(buffer);
        });
        doc.on('error', (error) => {
          this.logger.error(`PDF generation error: ${error.message}`, error.stack);
          reject(error);
        });

        // Call content function to build PDF
        content(doc);

        doc.end();
      } catch (error) {
        this.logger.error(`Failed to generate PDF: ${error.message}`, error.stack);
        reject(new Error(`Failed to generate PDF: ${error.message}`));
      }
    });
  }

  /**
   * Generate loan agreement PDF
   */
  async generateLoanAgreement(loanData: {
    loanId: string;
    customerName: string;
    amount: number;
    interestRate: number;
    term: number;
    terms: string[];
  }): Promise<Buffer> {
    return this.generatePDF((doc) => {
      // Title
      doc.fontSize(20).text('Loan Agreement', { align: 'center' });
      doc.moveDown();

      // Loan Details
      doc.fontSize(14).text('Loan Details:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Loan ID: ${loanData.loanId}`);
      doc.text(`Customer: ${loanData.customerName}`);
      doc.text(`Amount: $${loanData.amount.toLocaleString()}`);
      doc.text(`Interest Rate: ${loanData.interestRate}%`);
      doc.text(`Term: ${loanData.term} months`);
      doc.moveDown();

      // Terms and Conditions
      doc.fontSize(14).text('Terms and Conditions:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      loanData.terms.forEach((term, index) => {
        doc.text(`${index + 1}. ${term}`, { indent: 20 });
        doc.moveDown(0.3);
      });

      // Signature line
      doc.moveDown(2);
      doc.text('_________________________', { align: 'left' });
      doc.text('Borrower Signature', { align: 'left' });
      doc.moveDown();
      doc.text('_________________________', { align: 'left' });
      doc.text('Lender Signature', { align: 'left' });
    }, {
      size: 'LETTER',
      info: {
        Title: `Loan Agreement - ${loanData.loanId}`,
        Author: 'Uruti Lending',
        Subject: 'Loan Agreement',
      },
    });
  }

  /**
   * Generate statement PDF
   */
  async generateStatement(statementData: {
    customerName: string;
    loanId: string;
    period: string;
    transactions: Array<{
      date: string;
      description: string;
      amount: number;
      balance: number;
    }>;
  }): Promise<Buffer> {
    return this.generatePDF((doc) => {
      // Header
      doc.fontSize(18).text('Loan Statement', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Customer: ${statementData.customerName}`);
      doc.text(`Loan ID: ${statementData.loanId}`);
      doc.text(`Period: ${statementData.period}`);
      doc.moveDown();

      // Table header
      const tableTop = doc.y;
      doc.fontSize(10);
      doc.text('Date', 50, tableTop);
      doc.text('Description', 150, tableTop);
      doc.text('Amount', 400, tableTop, { align: 'right' });
      doc.text('Balance', 500, tableTop, { align: 'right' });

      // Table rows
      let currentY = tableTop + 20;
      statementData.transactions.forEach((transaction) => {
        doc.text(transaction.date, 50, currentY);
        doc.text(transaction.description, 150, currentY);
        doc.text(`$${transaction.amount.toFixed(2)}`, 400, currentY, { align: 'right' });
        doc.text(`$${transaction.balance.toFixed(2)}`, 500, currentY, { align: 'right' });
        currentY += 15;
      });
    });
  }

  /**
   * Parse PDF and extract text
   */
  async parsePDF(buffer: Buffer): Promise<{
    text: string;
    numPages: number;
    info: any;
  }> {
    try {
      const data = await (pdfParse as any)(buffer);
      this.logger.debug(`PDF parsed: ${data.numpages} pages, ${data.text.length} characters`);
      return {
        text: data.text,
        numPages: data.numpages,
        info: data.info,
      };
    } catch (error: any) {
      this.logger.error(`Failed to parse PDF: ${error.message}`, error.stack);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }
}

