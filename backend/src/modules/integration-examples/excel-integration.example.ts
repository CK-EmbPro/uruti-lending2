/**
 * Excel Service Integration Examples
 * 
 * This file demonstrates how to integrate the Excel service into existing modules
 */

import { Injectable } from '@nestjs/common';
import { ExcelService } from '../excel/excel.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../loan/entities/loan.entity';

@Injectable()
export class LoanExportService {
  constructor(
    private readonly excelService: ExcelService,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Export loans to Excel
   */
  async exportLoansToExcel(companyId: string, filters?: any): Promise<Buffer> {
    // Fetch loans
    const loans = await this.loanRepository.find({
      where: { companyId, ...filters },
    });

    // Transform to export format
    const exportData = loans.map((loan) => ({
      'Loan ID': loan.id,
      'Customer': loan.applicantId,
      'Amount': loan.loanAmount,
      'Interest Rate': loan.rateOfInterest,
      'Term': loan.repaymentPeriods,
      'Status': loan.status,
      'Created At': loan.createdAt.toISOString(),
    }));

    // Generate Excel
    return await this.excelService.generateExcel(exportData, {
      sheetName: 'Loans',
      headers: ['Loan ID', 'Customer', 'Amount', 'Interest Rate', 'Term', 'Status', 'Created At'],
      styles: {
        header: {
          font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
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
  async importLoansFromExcel(buffer: Buffer, companyId: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const data = await this.excelService.parseExcel(buffer, {
      skipEmptyRows: true,
    });

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        // Validate and create loan
        // This is a simplified example
        // Note: This is a simplified example - in production, use LoanService.create() with proper validation
        // The Loan entity doesn't have these fields directly - they come from LoanProduct
        // This example is for demonstration purposes only
        const loan = this.loanRepository.create({
          loanAmount: parseFloat(row.Amount || row['Amount']),
          rateOfInterest: parseFloat(row['Interest Rate'] || row.interestRate),
          repaymentPeriods: parseInt(row.Term || row.term, 10),
          // ... other required fields would need to be provided
        } as any); // Type assertion needed as this is an example

        await this.loanRepository.save(loan);
        success++;
      } catch (error) {
        failed++;
        errors.push(`Row ${row.__rowNum__ || 'unknown'}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }
}

