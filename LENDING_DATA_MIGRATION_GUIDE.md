# Frappe Lending - Data Migration Guide

## Overview
This guide provides comprehensive procedures for migrating data into the Frappe Lending platform from other systems, including CSV/Excel imports, API-based imports, data mapping, validation, and testing strategies.

---

## Table of Contents

1. [Migration Strategy](#1-migration-strategy)
2. [Data Mapping](#2-data-mapping)
3. [CSV/Excel Import](#3-csvexcel-import)
4. [API-Based Import](#4-api-based-import)
5. [Data Validation](#5-data-validation)
6. [Migration Procedures](#6-migration-procedures)
7. [Common Migration Scenarios](#7-common-migration-scenarios)
8. [Testing Migrated Data](#8-testing-migrated-data)
9. [Rollback Procedures](#9-rollback-procedures)

---

## 1. Migration Strategy

### 1.1 Migration Phases

```
Phase 1: Planning & Analysis
  ├── Identify source systems
  ├── Map data structures
  ├── Define migration scope
  └── Create migration plan

Phase 2: Data Extraction
  ├── Extract data from source
  ├── Clean and transform data
  └── Validate source data

Phase 3: Data Transformation
  ├── Map fields
  ├── Transform formats
  ├── Handle relationships
  └── Generate missing data

Phase 4: Data Import
  ├── Import master data
  ├── Import transactions
  ├── Link relationships
  └── Validate imported data

Phase 5: Verification
  ├── Data reconciliation
  ├── Business rule validation
  ├── Calculation verification
  └── User acceptance testing

Phase 6: Go-Live
  ├── Final data sync
  ├── Cutover
  └── Post-migration support
```

### 1.2 Migration Approach

**Big Bang Migration**: All data migrated at once
- Pros: Single cutover, simpler process
- Cons: Higher risk, longer downtime

**Phased Migration**: Data migrated in phases
- Pros: Lower risk, can test incrementally
- Cons: More complex, longer timeline

**Parallel Run**: Run both systems in parallel
- Pros: Can verify data continuously
- Cons: Requires maintaining both systems

### 1.3 Data Migration Checklist

- [ ] Source system analysis complete
- [ ] Data mapping documented
- [ ] Migration scripts developed
- [ ] Test environment setup
- [ ] Test migration completed
- [ ] Data validation rules defined
- [ ] Rollback plan prepared
- [ ] User training completed
- [ ] Go-live date confirmed

---

## 2. Data Mapping

### 2.1 Master Data Mapping

#### Loan Product Mapping

| Source Field | Target Field | Transformation | Notes |
|-------------|--------------|---------------|-------|
| `product_code` | `product_code` | Direct | Must be unique |
| `product_name` | `product_name` | Direct | Must be unique |
| `interest_rate` | `rate_of_interest` | Direct | Convert to percentage |
| `penalty_rate` | `penalty_interest_rate` | Direct | Convert to percentage |
| `max_amount` | `maximum_loan_amount` | Direct | Currency conversion if needed |
| `loan_type` | `is_term_loan` | Transform | Map "Term" → true, "LOC" → false |
| `schedule_type` | `repayment_schedule_type` | Map | Map to valid values |
| `disbursement_account_code` | `disbursement_account` | Lookup | Map account code to account name |
| `payment_account_code` | `payment_account` | Lookup | Map account code to account name |
| `loan_account_code` | `loan_account` | Lookup | Map account code to account name |

#### Loan Mapping

| Source Field | Target Field | Transformation | Notes |
|-------------|--------------|---------------|-------|
| `loan_id` | `loan_number` | Direct | May need prefix/suffix |
| `customer_id` | `applicant` | Lookup | Map to Customer/Employee |
| `customer_type` | `applicant_type` | Map | "C" → "Customer", "E" → "Employee" |
| `product_code` | `loan_product` | Lookup | Map to Loan Product |
| `loan_amount` | `loan_amount` | Direct | Currency conversion if needed |
| `interest_rate` | `rate_of_interest` | Direct | May override product rate |
| `disbursed_amount` | `disbursed_amount` | Calculate | Sum of disbursements |
| `status_code` | `status` | Map | Map status codes |
| `start_date` | `posting_date` | Direct | Date format conversion |
| `first_payment_date` | `repayment_start_date` | Direct | Date format conversion |
| `repayment_periods` | `repayment_periods` | Direct | |
| `repayment_frequency` | `repayment_frequency` | Map | Map to valid values |

### 2.2 Transaction Data Mapping

#### Disbursement Mapping

| Source Field | Target Field | Transformation | Notes |
|-------------|--------------|---------------|-------|
| `disbursement_id` | (auto-generated) | - | System generates ID |
| `loan_id` | `against_loan` | Lookup | Map to Loan |
| `disbursement_date` | `disbursement_date` | Direct | Date format conversion |
| `amount` | `disbursed_amount` | Direct | Currency conversion |
| `payment_mode` | `mode_of_payment` | Map | Map payment modes |
| `reference_number` | `reference_number` | Direct | |

#### Repayment Mapping

| Source Field | Target Field | Transformation | Notes |
|-------------|--------------|---------------|-------|
| `repayment_id` | (auto-generated) | - | System generates ID |
| `loan_id` | `against_loan` | Lookup | Map to Loan |
| `payment_date` | `posting_date` | Direct | Date format conversion |
| `amount_paid` | `amount_paid` | Direct | Currency conversion |
| `principal_paid` | `principal_paid` | Calculate | Allocate from amount |
| `interest_paid` | `interest_paid` | Calculate | Allocate from amount |
| `penalty_paid` | `penalty_paid` | Calculate | Allocate from amount |
| `payment_mode` | `mode_of_payment` | Map | Map payment modes |
| `reference_number` | `reference_number` | Direct | |

### 2.3 Data Transformation Functions

#### TypeScript/JavaScript

```typescript
// Data transformation utilities
export class DataTransformer {
  // Map status codes
  static mapLoanStatus(sourceStatus: string): LoanStatus {
    const statusMap: Record<string, LoanStatus> = {
      'D': 'Draft',
      'S': 'Sanctioned',
      'PD': 'Partially Disbursed',
      'D': 'Disbursed',
      'A': 'Active',
      'C': 'Closed',
      'WO': 'Written Off'
    };
    return statusMap[sourceStatus] || 'Draft';
  }
  
  // Map applicant type
  static mapApplicantType(sourceType: string): ApplicantType {
    return sourceType === 'C' ? 'Customer' : 'Employee';
  }
  
  // Map repayment frequency
  static mapRepaymentFrequency(sourceFreq: string): RepaymentFrequency {
    const freqMap: Record<string, RepaymentFrequency> = {
      'M': 'Monthly',
      'W': 'Weekly',
      'BW': 'Bi-Weekly',
      'Q': 'Quarterly',
      'D': 'Daily'
    };
    return freqMap[sourceFreq] || 'Monthly';
  }
  
  // Convert date format
  static convertDate(sourceDate: string, format: string): Date {
    // Handle various date formats
    if (format === 'YYYY-MM-DD') {
      return new Date(sourceDate);
    } else if (format === 'DD/MM/YYYY') {
      const [day, month, year] = sourceDate.split('/');
      return new Date(`${year}-${month}-${day}`);
    }
    // Add more format handlers
    return new Date(sourceDate);
  }
  
  // Convert currency
  static convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRate: number
  ): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    return amount * exchangeRate;
  }
  
  // Generate loan number
  static generateLoanNumber(
    prefix: string,
    sequence: number,
    year: number
  ): string {
    return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;
  }
}
```

#### Python

```python
# data_transformation.py
from datetime import datetime
from decimal import Decimal
from typing import Dict, Optional

class DataTransformer:
    # Map status codes
    @staticmethod
    def map_loan_status(source_status: str) -> str:
        status_map = {
            'D': 'Draft',
            'S': 'Sanctioned',
            'PD': 'Partially Disbursed',
            'D': 'Disbursed',
            'A': 'Active',
            'C': 'Closed',
            'WO': 'Written Off'
        }
        return status_map.get(source_status, 'Draft')
    
    # Map applicant type
    @staticmethod
    def map_applicant_type(source_type: str) -> str:
        return 'Customer' if source_type == 'C' else 'Employee'
    
    # Convert date format
    @staticmethod
    def convert_date(source_date: str, format: str = 'YYYY-MM-DD') -> datetime:
        if format == 'YYYY-MM-DD':
            return datetime.strptime(source_date, '%Y-%m-%d')
        elif format == 'DD/MM/YYYY':
            return datetime.strptime(source_date, '%d/%m/%Y')
        # Add more format handlers
        return datetime.strptime(source_date, '%Y-%m-%d')
    
    # Convert currency
    @staticmethod
    def convert_currency(
        amount: Decimal,
        from_currency: str,
        to_currency: str,
        exchange_rate: Decimal
    ) -> Decimal:
        if from_currency == to_currency:
            return amount
        return amount * exchange_rate
```

---

## 3. CSV/Excel Import

### 3.1 CSV Import Script

#### TypeScript/JavaScript

```typescript
// import/csvImporter.ts
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { LoanService } from '../services/LoanService';
import { DataTransformer } from './DataTransformer';

export class CSVImporter {
  constructor(private loanService: LoanService) {}
  
  async importLoans(filePath: string): Promise<ImportResult> {
    const results: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', async () => {
          for (const row of rows) {
            try {
              // Transform data
              const loanData = this.transformLoanRow(row);
              
              // Validate
              await this.validateLoanData(loanData);
              
              // Import
              await this.loanService.createLoan(loanData);
              
              results.success++;
            } catch (error) {
              results.failed++;
              results.errors.push({
                row: row,
                error: error.message
              });
            }
          }
          
          resolve(results);
        })
        .on('error', reject);
    });
  }
  
  private transformLoanRow(row: any): CreateLoanDTO {
    return {
      loanNumber: DataTransformer.generateLoanNumber(
        'LOAN',
        parseInt(row.sequence),
        new Date().getFullYear()
      ),
      companyId: row.company_id,
      applicantType: DataTransformer.mapApplicantType(row.customer_type),
      applicantId: row.customer_id,
      loanProductId: row.product_code,
      loanAmount: parseFloat(row.loan_amount),
      rateOfInterest: parseFloat(row.interest_rate),
      repaymentPeriods: parseInt(row.repayment_periods),
      repaymentFrequency: DataTransformer.mapRepaymentFrequency(
        row.repayment_frequency
      ),
      repaymentStartDate: DataTransformer.convertDate(
        row.first_payment_date,
        'YYYY-MM-DD'
      ),
      status: DataTransformer.mapLoanStatus(row.status),
      postingDate: DataTransformer.convertDate(row.start_date, 'YYYY-MM-DD')
    };
  }
  
  private async validateLoanData(data: CreateLoanDTO): Promise<void> {
    // Validate required fields
    if (!data.loanNumber || !data.applicantId || !data.loanProductId) {
      throw new Error('Missing required fields');
    }
    
    // Validate amounts
    if (data.loanAmount <= 0) {
      throw new Error('Loan amount must be positive');
    }
    
    // Validate dates
    if (data.postingDate > new Date()) {
      throw new Error('Posting date cannot be in future');
    }
    
    // Check if loan product exists
    const product = await this.loanService.getLoanProduct(data.loanProductId);
    if (!product) {
      throw new Error(`Loan product ${data.loanProductId} not found`);
    }
  }
}
```

#### Python

```python
# import/csv_importer.py
import csv
from typing import List, Dict
from decimal import Decimal
from datetime import datetime

class CSVImporter:
    def __init__(self, loan_service):
        self.loan_service = loan_service
    
    def import_loans(self, file_path: str) -> Dict:
        results = {
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                try:
                    # Transform data
                    loan_data = self._transform_loan_row(row)
                    
                    # Validate
                    self._validate_loan_data(loan_data)
                    
                    # Import
                    self.loan_service.create_loan(loan_data)
                    
                    results['success'] += 1
                except Exception as e:
                    results['failed'] += 1
                    results['errors'].append({
                        'row': row_num,
                        'data': row,
                        'error': str(e)
                    })
        
        return results
    
    def _transform_loan_row(self, row: Dict) -> Dict:
        return {
            'loan_number': DataTransformer.generate_loan_number(
                'LOAN',
                int(row['sequence']),
                datetime.now().year
            ),
            'company_id': row['company_id'],
            'applicant_type': DataTransformer.map_applicant_type(
                row['customer_type']
            ),
            'applicant_id': row['customer_id'],
            'loan_product_id': row['product_code'],
            'loan_amount': Decimal(row['loan_amount']),
            'rate_of_interest': Decimal(row['interest_rate']),
            'repayment_periods': int(row['repayment_periods']),
            'repayment_frequency': DataTransformer.map_repayment_frequency(
                row['repayment_frequency']
            ),
            'repayment_start_date': DataTransformer.convert_date(
                row['first_payment_date']
            ),
            'status': DataTransformer.map_loan_status(row['status']),
            'posting_date': DataTransformer.convert_date(row['start_date'])
        }
    
    def _validate_loan_data(self, data: Dict):
        # Validate required fields
        required_fields = ['loan_number', 'applicant_id', 'loan_product_id']
        for field in required_fields:
            if not data.get(field):
                raise ValueError(f'Missing required field: {field}')
        
        # Validate amounts
        if data['loan_amount'] <= 0:
            raise ValueError('Loan amount must be positive')
        
        # Validate dates
        if data['posting_date'] > datetime.now().date():
            raise ValueError('Posting date cannot be in future')
```

### 3.2 Excel Import Script

#### Python (using pandas)

```python
# import/excel_importer.py
import pandas as pd
from typing import Dict, List

class ExcelImporter:
    def __init__(self, loan_service):
        self.loan_service = loan_service
    
    def import_loans(self, file_path: str, sheet_name: str = 'Loans') -> Dict:
        # Read Excel file
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        
        results = {
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        for index, row in df.iterrows():
            try:
                # Convert row to dict
                row_dict = row.to_dict()
                
                # Transform data
                loan_data = self._transform_loan_row(row_dict)
                
                # Validate
                self._validate_loan_data(loan_data)
                
                # Import
                self.loan_service.create_loan(loan_data)
                
                results['success'] += 1
            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'row': index + 2,  # +2 for header and 0-based index
                    'error': str(e)
                })
        
        return results
```

---

## 4. API-Based Import

### 4.1 REST API Import Client

```typescript
// import/apiImporter.ts
import axios from 'axios';

export class APIImporter {
  private apiClient: axios.AxiosInstance;
  
  constructor(baseURL: string, apiKey: string) {
    this.apiClient = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  async importLoan(loanData: any): Promise<any> {
    try {
      const response = await this.apiClient.post('/api/loans', loanData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to import loan: ${error.message}`);
    }
  }
  
  async importLoansBatch(loans: any[]): Promise<ImportResult> {
    const results: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const loan of loans) {
      try {
        await this.importLoan(loan);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          loan: loan,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  async importRepayments(repayments: any[]): Promise<ImportResult> {
    const results: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const repayment of repayments) {
      try {
        await this.apiClient.post(
          `/api/loans/${repayment.loanId}/repayments`,
          repayment
        );
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          repayment: repayment,
          error: error.message
        });
      }
    }
    
    return results;
  }
}
```

---

## 5. Data Validation

### 5.1 Validation Rules

```typescript
// validation/migrationValidator.ts
export class MigrationValidator {
  static validateLoanProduct(data: any): ValidationResult {
    const errors: string[] = [];
    
    // Required fields
    if (!data.product_code) {
      errors.push('Product code is required');
    }
    if (!data.product_name) {
      errors.push('Product name is required');
    }
    
    // Unique constraints
    // Check if product_code already exists
    
    // Data type validations
    if (data.rate_of_interest < 0) {
      errors.push('Interest rate cannot be negative');
    }
    if (data.maximum_loan_amount < 0) {
      errors.push('Maximum loan amount cannot be negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  static validateLoan(data: any): ValidationResult {
    const errors: string[] = [];
    
    // Required fields
    if (!data.loan_number) {
      errors.push('Loan number is required');
    }
    if (!data.applicant_id) {
      errors.push('Applicant ID is required');
    }
    if (!data.loan_product_id) {
      errors.push('Loan product ID is required');
    }
    
    // Amount validations
    if (data.loan_amount <= 0) {
      errors.push('Loan amount must be positive');
    }
    
    // Date validations
    if (data.posting_date > new Date()) {
      errors.push('Posting date cannot be in future');
    }
    
    // Relationship validations
    // Check if loan product exists
    // Check if applicant exists
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}
```

---

## 6. Migration Procedures

### 6.1 Master Data Migration

```typescript
// migration/masterDataMigration.ts
export class MasterDataMigration {
  async migrateLoanProducts(sourceData: any[]): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const sourceProduct of sourceData) {
      try {
        // Transform
        const productData = this.transformProduct(sourceProduct);
        
        // Validate
        const validation = MigrationValidator.validateLoanProduct(productData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
        
        // Import
        await this.loanProductService.createProduct(productData);
        
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          source: sourceProduct,
          error: error.message
        });
      }
    }
    
    return result;
  }
}
```

### 6.2 Transaction Data Migration

```typescript
// migration/transactionMigration.ts
export class TransactionMigration {
  async migrateLoans(sourceLoans: any[]): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    // Sort by posting date to maintain chronological order
    const sortedLoans = sourceLoans.sort(
      (a, b) => new Date(a.posting_date).getTime() - 
                 new Date(b.posting_date).getTime()
    );
    
    for (const sourceLoan of sortedLoans) {
      try {
        // Transform
        const loanData = this.transformLoan(sourceLoan);
        
        // Validate
        const validation = MigrationValidator.validateLoan(loanData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
        
        // Import loan
        const loan = await this.loanService.createLoan(loanData);
        
        // Migrate related transactions
        await this.migrateDisbursements(sourceLoan.disbursements, loan.id);
        await this.migrateRepayments(sourceLoan.repayments, loan.id);
        
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          source: sourceLoan,
          error: error.message
        });
      }
    }
    
    return result;
  }
  
  async migrateDisbursements(
    sourceDisbursements: any[],
    loanId: string
  ): Promise<void> {
    for (const sourceDisbursement of sourceDisbursements) {
      const disbursementData = this.transformDisbursement(
        sourceDisbursement,
        loanId
      );
      await this.disbursementService.createDisbursement(disbursementData);
    }
  }
  
  async migrateRepayments(
    sourceRepayments: any[],
    loanId: string
  ): Promise<void> {
    // Sort by date
    const sortedRepayments = sourceRepayments.sort(
      (a, b) => new Date(a.payment_date).getTime() - 
                 new Date(b.payment_date).getTime()
    );
    
    for (const sourceRepayment of sortedRepayments) {
      const repaymentData = this.transformRepayment(
        sourceRepayment,
        loanId
      );
      await this.repaymentService.processRepayment(repaymentData);
    }
  }
}
```

---

## 7. Common Migration Scenarios

### 7.1 Scenario 1: Migrating from Legacy System

**Source System**: Custom-built lending system
**Data Format**: SQL database

**Steps**:
1. Export data from source database
2. Map database schema to Lending schema
3. Transform data formats
4. Import master data first
5. Import loans in chronological order
6. Import transactions in chronological order
7. Verify data integrity

### 7.2 Scenario 2: Migrating from Excel/CSV

**Source System**: Excel spreadsheets
**Data Format**: CSV files

**Steps**:
1. Clean CSV data
2. Map columns to fields
3. Validate data
4. Import using CSV importer
5. Handle errors and retry
6. Verify imported data

### 7.3 Scenario 3: Migrating from Another Lending Platform

**Source System**: Commercial lending software
**Data Format**: API or database export

**Steps**:
1. Analyze source system structure
2. Map entities and relationships
3. Extract data via API or export
4. Transform to target format
5. Import in phases
6. Reconcile data

---

## 8. Testing Migrated Data

### 8.1 Data Reconciliation

```typescript
// testing/dataReconciliation.ts
export class DataReconciliation {
  async reconcileLoans(
    sourceData: any[],
    targetLoans: Loan[]
  ): Promise<ReconciliationResult> {
    const result: ReconciliationResult = {
      matched: 0,
      mismatched: 0,
      missing: 0,
      extra: 0,
      discrepancies: []
    };
    
    // Create lookup maps
    const sourceMap = new Map(
      sourceData.map(s => [s.loan_id, s])
    );
    const targetMap = new Map(
      targetLoans.map(t => [t.loanNumber, t])
    );
    
    // Check each source loan
    for (const [sourceId, sourceLoan] of sourceMap) {
      const targetLoan = targetMap.get(sourceLoan.loan_number);
      
      if (!targetLoan) {
        result.missing++;
        result.discrepancies.push({
          type: 'missing',
          sourceId: sourceId,
          message: 'Loan not found in target system'
        });
        continue;
      }
      
      // Compare key fields
      const discrepancies = this.compareLoans(sourceLoan, targetLoan);
      if (discrepancies.length === 0) {
        result.matched++;
      } else {
        result.mismatched++;
        result.discrepancies.push(...discrepancies);
      }
    }
    
    // Check for extra loans in target
    for (const [targetId, targetLoan] of targetMap) {
      if (!sourceMap.has(targetLoan.loanNumber)) {
        result.extra++;
      }
    }
    
    return result;
  }
  
  private compareLoans(source: any, target: Loan): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];
    
    // Compare amounts (allow small rounding differences)
    if (Math.abs(source.loan_amount - target.loanAmount) > 0.01) {
      discrepancies.push({
        field: 'loan_amount',
        source: source.loan_amount,
        target: target.loanAmount,
        difference: source.loan_amount - target.loanAmount
      });
    }
    
    // Compare dates
    if (new Date(source.start_date).getTime() !== 
        target.postingDate.getTime()) {
      discrepancies.push({
        field: 'posting_date',
        source: source.start_date,
        target: target.postingDate.toISOString()
      });
    }
    
    return discrepancies;
  }
}
```

### 8.2 Calculation Verification

```typescript
// testing/calculationVerification.ts
export class CalculationVerification {
  async verifyLoanCalculations(loan: Loan): Promise<VerificationResult> {
    const result: VerificationResult = {
      passed: true,
      errors: []
    };
    
    // Verify EMI calculation
    const expectedEMI = calculateEMI(
      loan.loanAmount,
      loan.rateOfInterest,
      loan.repaymentPeriods,
      loan.repaymentFrequency
    );
    
    const schedule = await this.getRepaymentSchedule(loan.id);
    if (schedule.entries.length > 0) {
      const actualEMI = schedule.entries[0].totalPayment;
      if (Math.abs(expectedEMI - actualEMI) > 1) {
        result.passed = false;
        result.errors.push({
          type: 'emi_mismatch',
          expected: expectedEMI,
          actual: actualEMI
        });
      }
    }
    
    // Verify outstanding calculation
    const outstanding = await this.calculateOutstanding(loan.id);
    const expectedOutstanding = this.calculateExpectedOutstanding(loan);
    
    if (Math.abs(outstanding.total - expectedOutstanding) > 0.01) {
      result.passed = false;
      result.errors.push({
        type: 'outstanding_mismatch',
        expected: expectedOutstanding,
        actual: outstanding.total
      });
    }
    
    return result;
  }
}
```

---

## 9. Rollback Procedures

### 9.1 Rollback Strategy

```typescript
// migration/rollback.ts
export class MigrationRollback {
  async rollbackMigration(migrationId: string): Promise<void> {
    // Get migration record
    const migration = await this.getMigration(migrationId);
    
    // Rollback in reverse order
    // 1. Delete transactions
    await this.deleteTransactions(migration.transactionIds);
    
    // 2. Delete loans
    await this.deleteLoans(migration.loanIds);
    
    // 3. Delete loan products (if not used)
    await this.deleteLoanProducts(migration.productIds);
    
    // 4. Mark migration as rolled back
    await this.markMigrationRolledBack(migrationId);
  }
  
  private async deleteTransactions(transactionIds: string[]): Promise<void> {
    for (const id of transactionIds) {
      await this.repaymentService.deleteRepayment(id);
      await this.disbursementService.deleteDisbursement(id);
    }
  }
  
  private async deleteLoans(loanIds: string[]): Promise<void> {
    for (const id of loanIds) {
      await this.loanService.deleteLoan(id);
    }
  }
}
```

---

## Conclusion

This migration guide provides comprehensive procedures for migrating data into the Frappe Lending platform. Key points:

1. **Plan thoroughly** - Understand source and target systems
2. **Map carefully** - Ensure accurate field mapping
3. **Validate extensively** - Check data before and after import
4. **Test incrementally** - Test with small datasets first
5. **Document everything** - Keep detailed migration logs
6. **Have rollback plan** - Be prepared to undo migration if needed

Following this guide will ensure a smooth and successful data migration.

