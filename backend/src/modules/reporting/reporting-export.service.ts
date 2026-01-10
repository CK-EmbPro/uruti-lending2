import { Injectable } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Injectable()
export class ReportingExportService {
  constructor(private readonly reportingService: ReportingService) {}

  /**
   * Export portfolio report as CSV
   */
  async exportPortfolioReportAsCsv(filters: {
    fromDate?: string;
    toDate?: string;
    companyId?: string;
    loanProductId?: string;
  }): Promise<string> {
    const report = await this.reportingService.getPortfolioReport(filters);

    const rows: string[] = [];
    
    // Header
    rows.push('Portfolio Report');
    rows.push(`Generated: ${new Date().toISOString()}`);
    rows.push('');
    
    // Summary
    rows.push('Summary');
    rows.push(`Total Loans,${report.totalLoans}`);
    rows.push(`Total Disbursed,${report.totalDisbursed}`);
    rows.push(`Total Outstanding,${report.totalOutstanding}`);
    rows.push(`Total Principal Outstanding,${report.totalPrincipalOutstanding}`);
    rows.push(`Total Interest Outstanding,${report.totalInterestOutstanding}`);
    rows.push(`Total Penalty Outstanding,${report.totalPenaltyOutstanding}`);
    rows.push(`Active Loans,${report.activeLoans}`);
    rows.push(`Closed Loans,${report.closedLoans}`);
    rows.push(`NPA Loans,${report.npaLoans}`);
    rows.push('');
    
    // By Status
    rows.push('By Status');
    rows.push('Status,Count');
    for (const [status, count] of Object.entries(report.byStatus)) {
      rows.push(`${status},${count}`);
    }
    rows.push('');
    
    // By Product
    rows.push('By Product');
    rows.push('Product ID,Product Name,Count,Disbursed,Outstanding');
    for (const product of report.byProduct) {
      rows.push(
        `${product.productId},${product.productName},${product.count},${product.disbursed},${product.outstanding}`,
      );
    }

    return rows.join('\n');
  }

  /**
   * Export NPA report as CSV
   */
  async exportNpaReportAsCsv(filters: {
    asOnDate?: string;
    companyId?: string;
    npaOnly?: boolean;
    classificationCode?: string;
  }): Promise<string> {
    const report = await this.reportingService.getNpaReport(filters);

    const rows: string[] = [];
    
    // Header
    rows.push('NPA Report');
    rows.push(`Generated: ${new Date().toISOString()}`);
    rows.push('');
    
    // Summary
    rows.push('Summary');
    rows.push(`Total NPA Loans,${report.totalNpaLoans}`);
    rows.push(`Total NPA Amount,${report.totalNpaAmount}`);
    rows.push('');
    
    // By Classification
    rows.push('By Classification');
    rows.push('Classification Code,Classification Name,Count,Amount,Average DPD');
    for (const classification of report.byClassification) {
      rows.push(
        `${classification.classificationCode},${classification.classificationName},${classification.count},${classification.amount},${classification.averageDpd}`,
      );
    }
    rows.push('');
    
    // NPA Loans Detail
    rows.push('NPA Loans Detail');
    rows.push('Loan ID,Loan Number,Applicant ID,Disbursed Amount,Outstanding Amount,Days Past Due,Classification Code,Classification Name');
    for (const loan of report.npaLoans) {
      rows.push(
        `${loan.loanId},${loan.loanNumber},${loan.applicantId},${loan.disbursedAmount},${loan.outstandingAmount},${loan.daysPastDue},${loan.classificationCode},${loan.classificationName}`,
      );
    }

    return rows.join('\n');
  }

  /**
   * Export collection report as CSV
   */
  async exportCollectionReportAsCsv(filters: {
    fromDate: string;
    toDate: string;
    companyId?: string;
    loanProductId?: string;
  }): Promise<string> {
    const report = await this.reportingService.getCollectionReport(filters);

    const rows: string[] = [];
    
    // Header
    rows.push('Collection Report');
    rows.push(`Period: ${filters.fromDate} to ${filters.toDate}`);
    rows.push(`Generated: ${new Date().toISOString()}`);
    rows.push('');
    
    // Summary
    rows.push('Summary');
    rows.push(`Total Collections,${report.totalCollections}`);
    rows.push(`Total Principal Collected,${report.totalPrincipalCollected}`);
    rows.push(`Total Interest Collected,${report.totalInterestCollected}`);
    rows.push(`Total Penalty Collected,${report.totalPenaltyCollected}`);
    rows.push(`Total Charges Collected,${report.totalChargesCollected}`);
    rows.push(`Collection Count,${report.collectionCount}`);
    rows.push('');
    
    // By Date
    rows.push('By Date');
    rows.push('Date,Count,Amount');
    for (const entry of report.byDate) {
      rows.push(`${entry.date},${entry.count},${entry.amount}`);
    }
    rows.push('');
    
    // By Product
    rows.push('By Product');
    rows.push('Product ID,Product Name,Count,Amount');
    for (const product of report.byProduct) {
      rows.push(
        `${product.productId},${product.productName},${product.count},${product.amount}`,
      );
    }

    return rows.join('\n');
  }

  /**
   * Export overdue report as CSV
   */
  async exportOverdueReportAsCsv(filters: {
    asOnDate?: string;
    companyId?: string;
    loanProductId?: string;
    minDaysPastDue?: number;
  }): Promise<string> {
    const report = await this.reportingService.getOverdueReport(filters);

    const rows: string[] = [];
    
    // Header
    rows.push('Overdue Report');
    rows.push(`Generated: ${new Date().toISOString()}`);
    rows.push('');
    
    // Summary
    rows.push('Summary');
    rows.push(`Total Overdue Loans,${report.totalOverdueLoans}`);
    rows.push(`Total Overdue Amount,${report.totalOverdueAmount}`);
    rows.push('');
    
    // By DPD Range
    rows.push('By Days Past Due Range');
    rows.push('Range,Count,Amount');
    for (const range of report.byDaysPastDue) {
      rows.push(`${range.range},${range.count},${range.amount}`);
    }
    rows.push('');
    
    // Overdue Loans Detail
    rows.push('Overdue Loans Detail');
    rows.push('Loan ID,Loan Number,Applicant ID,Days Past Due,Overdue Amount,Last Payment Date');
    for (const loan of report.overdueLoans) {
      rows.push(
        `${loan.loanId},${loan.loanNumber},${loan.applicantId},${loan.daysPastDue},${loan.overdueAmount},${loan.lastPaymentDate ? loan.lastPaymentDate.toISOString().split('T')[0] : 'N/A'}`,
      );
    }

    return rows.join('\n');
  }
}

