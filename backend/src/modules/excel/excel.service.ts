import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore - exceljs types may not be available
import * as ExcelJS from 'exceljs';
import * as csv from 'csv-parser';
// @ts-ignore - csv-writer types may not be available
import * as csvWriter from 'csv-writer';
// @ts-ignore - fast-csv types may not be available
import * as fastCsv from 'fast-csv';
import { Readable } from 'stream';

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  headers?: string[];
  styles?: {
    header?: Partial<ExcelJS.Style>;
    row?: Partial<ExcelJS.Style>;
  };
}

export interface ExcelImportOptions {
  sheetIndex?: number;
  startRow?: number;
  headers?: string[];
  skipEmptyRows?: boolean;
}

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  /**
   * Generate Excel file from data
   */
  async generateExcel(
    data: any[],
    options: ExcelExportOptions = {},
  ): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1');

      // Set headers
      if (options.headers && options.headers.length > 0) {
        worksheet.columns = options.headers.map((header) => ({
          header,
          key: header.toLowerCase().replace(/\s+/g, '_'),
          width: 20,
        }));

        // Apply header styles
        if (options.styles?.header) {
          worksheet.getRow(1).font = options.styles.header.font || { bold: true };
          worksheet.getRow(1).fill = options.styles.header.fill || {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
          };
        }
      } else if (data.length > 0) {
        // Auto-detect headers from first row
        const firstRow = data[0];
        const headers = Object.keys(firstRow);
        worksheet.columns = headers.map((header) => ({
          header: header.charAt(0).toUpperCase() + header.slice(1),
          key: header,
          width: 20,
        }));

        // Apply header styles
        if (options.styles?.header) {
          worksheet.getRow(1).font = options.styles.header.font || { bold: true };
          worksheet.getRow(1).fill = options.styles.header.fill || {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
          };
        }
      }

      // Add data rows
      data.forEach((row, index) => {
        const worksheetRow = worksheet.addRow(row);
        
        // Apply row styles
        if (options.styles?.row) {
          worksheetRow.font = options.styles.row.font;
          worksheetRow.fill = options.styles.row.fill;
        }
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      this.logger.debug(`Excel file generated: ${data.length} rows`);
      return Buffer.from(buffer);
    } catch (error) {
      this.logger.error(`Failed to generate Excel: ${error.message}`, error.stack);
      throw new Error(`Failed to generate Excel: ${error.message}`);
    }
  }

  /**
   * Parse Excel file
   */
  async parseExcel(
    buffer: Buffer,
    options: ExcelImportOptions = {},
  ): Promise<any[]> {
    try {
      const workbook = new ExcelJS.Workbook();
      // Convert buffer to proper Buffer type for ExcelJS
      // @ts-ignore - ExcelJS accepts Buffer but TypeScript types are incompatible
      await workbook.xlsx.load(buffer);

      const worksheet =
        workbook.worksheets[options.sheetIndex || 0] || workbook.worksheets[0];

      if (!worksheet) {
        throw new Error('No worksheet found');
      }

      const data: any[] = [];
      const startRow = options.startRow || 1;
      const headers = options.headers || [];

      // Get headers from first row if not provided
      let actualHeaders: string[] = [];
      if (headers.length > 0) {
        actualHeaders = headers;
      } else {
        const firstRow = worksheet.getRow(startRow);
        const rowValues = Array.isArray(firstRow.values) ? firstRow.values : [];
        actualHeaders = rowValues
          .slice(1)
          .map((val) => String(val || '').trim())
          .filter((val) => val.length > 0);
      }

      // Parse rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= startRow) return; // Skip header row

        const rowData: any = {};
        actualHeaders.forEach((header, index) => {
          const cell = row.getCell(index + 1);
          rowData[header] = cell.value;
        });

        // Skip empty rows if option is set
        if (options.skipEmptyRows) {
          const hasData = Object.values(rowData).some(
            (val) => val !== null && val !== undefined && val !== '',
          );
          if (!hasData) return;
        }

        data.push(rowData);
      });

      this.logger.debug(`Excel file parsed: ${data.length} rows`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to parse Excel: ${error.message}`, error.stack);
      throw new Error(`Failed to parse Excel: ${error.message}`);
    }
  }

  /**
   * Generate CSV file from data
   */
  async generateCSV(
    data: any[],
    headers?: string[],
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const csvData: string[] = [];

        // Determine headers
        let actualHeaders: string[] = [];
        if (headers && headers.length > 0) {
          actualHeaders = headers;
        } else if (data.length > 0) {
          actualHeaders = Object.keys(data[0]);
        }

        // Add header row
        csvData.push(actualHeaders.join(','));

        // Add data rows
        data.forEach((row) => {
          const values = actualHeaders.map((header) => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          });
          csvData.push(values.join(','));
        });

        const csvString = csvData.join('\n');
        this.logger.debug(`CSV file generated: ${data.length} rows`);
        resolve(csvString);
      } catch (error) {
        this.logger.error(`Failed to generate CSV: ${error.message}`, error.stack);
        reject(new Error(`Failed to generate CSV: ${error.message}`));
      }
    });
  }

  /**
   * Parse CSV file
   */
  async parseCSV(
    csvString: string,
    headers?: string[],
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const data: any[] = [];
        const stream = Readable.from([csvString]);

        stream
          .pipe(csv({ headers: headers || true }))
          .on('data', (row) => data.push(row))
          .on('end', () => {
            this.logger.debug(`CSV file parsed: ${data.length} rows`);
            resolve(data);
          })
          .on('error', (error) => {
            this.logger.error(`Failed to parse CSV: ${error.message}`, error.stack);
            reject(new Error(`Failed to parse CSV: ${error.message}`));
          });
      } catch (error) {
        this.logger.error(`Failed to parse CSV: ${error.message}`, error.stack);
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  }

  /**
   * Generate CSV using fast-csv (for large files)
   */
  async generateCSVFast(
    data: any[],
    headers?: string[],
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const csvRows: string[] = [];
        const actualHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);

        fastCsv
          .writeToString(data, { headers: actualHeaders })
          .then((csvString) => {
            this.logger.debug(`CSV file generated (fast): ${data.length} rows`);
            resolve(csvString);
          })
          .catch((error) => {
            this.logger.error(`Failed to generate CSV: ${error.message}`, error.stack);
            reject(new Error(`Failed to generate CSV: ${error.message}`));
          });
      } catch (error) {
        this.logger.error(`Failed to generate CSV: ${error.message}`, error.stack);
        reject(new Error(`Failed to generate CSV: ${error.message}`));
      }
    });
  }

  /**
   * Export loans to Excel
   */
  async exportLoans(loans: any[]): Promise<Buffer> {
    return this.generateExcel(loans, {
      sheetName: 'Loans',
      headers: ['ID', 'Customer', 'Amount', 'Status', 'Created At'],
      styles: {
        header: {
          font: { bold: true, size: 12 },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
          },
        },
      },
    });
  }

  /**
   * Import loans from Excel
   */
  async importLoans(buffer: Buffer): Promise<any[]> {
    return this.parseExcel(buffer, {
      sheetIndex: 0,
      startRow: 1,
      skipEmptyRows: true,
    });
  }
}

