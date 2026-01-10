import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class EnhanceLoanProductWithEligibilityAndMarketing1765200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('loan_products');

    if (!table) {
      throw new Error('loan_products table not found');
    }

    // Helper function to add column if it doesn't exist
    const addColumnIfNotExists = async (
      columnName: string,
      column: TableColumn,
    ) => {
      const existingColumn = table.findColumnByName(columnName);
      if (!existingColumn) {
        await queryRunner.addColumn('loan_products', column);
      }
    };

    // Add eligibility criteria fields
    await addColumnIfNotExists(
      'minimumLoanAmount',
      new TableColumn({
        name: 'minimumLoanAmount',
        type: 'decimal',
        precision: 15,
        scale: 2,
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'minimumTerm',
      new TableColumn({
        name: 'minimumTerm',
        type: 'int',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'maximumTerm',
      new TableColumn({
        name: 'maximumTerm',
        type: 'int',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'minimumAge',
      new TableColumn({
        name: 'minimumAge',
        type: 'int',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'maximumAge',
      new TableColumn({
        name: 'maximumAge',
        type: 'int',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'minimumMonthlyIncome',
      new TableColumn({
        name: 'minimumMonthlyIncome',
        type: 'decimal',
        precision: 15,
        scale: 2,
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'minimumAnnualIncome',
      new TableColumn({
        name: 'minimumAnnualIncome',
        type: 'decimal',
        precision: 15,
        scale: 2,
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'minimumCreditScore',
      new TableColumn({
        name: 'minimumCreditScore',
        type: 'int',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'maximumDebtToIncomeRatio',
      new TableColumn({
        name: 'maximumDebtToIncomeRatio',
        type: 'decimal',
        precision: 5,
        scale: 2,
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'employmentTypes',
      new TableColumn({
        name: 'employmentTypes',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'requiredDocuments',
      new TableColumn({
        name: 'requiredDocuments',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'eligibleCountries',
      new TableColumn({
        name: 'eligibleCountries',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'eligibleRegions',
      new TableColumn({
        name: 'eligibleRegions',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'requiresCollateral',
      new TableColumn({
        name: 'requiresCollateral',
        type: 'boolean',
        default: false,
      }),
    );

    await addColumnIfNotExists(
      'collateralRequirements',
      new TableColumn({
        name: 'collateralRequirements',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add marketing & audience-facing content
    await addColumnIfNotExists(
      'productTagline',
      new TableColumn({
        name: 'productTagline',
        type: 'text',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'shortDescription',
      new TableColumn({
        name: 'shortDescription',
        type: 'text',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'productHighlights',
      new TableColumn({
        name: 'productHighlights',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'keyFeatures',
      new TableColumn({
        name: 'keyFeatures',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'benefits',
      new TableColumn({
        name: 'benefits',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'targetAudience',
      new TableColumn({
        name: 'targetAudience',
        type: 'text',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'howItWorks',
      new TableColumn({
        name: 'howItWorks',
        type: 'text',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'faqs',
      new TableColumn({
        name: 'faqs',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'productImages',
      new TableColumn({
        name: 'productImages',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'promotionalBannerUrl',
      new TableColumn({
        name: 'promotionalBannerUrl',
        type: 'text',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'productIconUrl',
      new TableColumn({
        name: 'productIconUrl',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add product options & flexibility
    await addColumnIfNotExists(
      'allowsPrepayment',
      new TableColumn({
        name: 'allowsPrepayment',
        type: 'boolean',
        default: true,
      }),
    );

    await addColumnIfNotExists(
      'allowsPartialPrepayment',
      new TableColumn({
        name: 'allowsPartialPrepayment',
        type: 'boolean',
        default: false,
      }),
    );

    await addColumnIfNotExists(
      'allowsRefinancing',
      new TableColumn({
        name: 'allowsRefinancing',
        type: 'boolean',
        default: false,
      }),
    );

    await addColumnIfNotExists(
      'allowsTopUp',
      new TableColumn({
        name: 'allowsTopUp',
        type: 'boolean',
        default: false,
      }),
    );

    await addColumnIfNotExists(
      'prepaymentCharges',
      new TableColumn({
        name: 'prepaymentCharges',
        type: 'decimal',
        precision: 5,
        scale: 2,
        isNullable: true,
      }),
    );

    // Add processing & disbursement
    await addColumnIfNotExists(
      'averageProcessingTime',
      new TableColumn({
        name: 'averageProcessingTime',
        type: 'int',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'averageDisbursementTime',
      new TableColumn({
        name: 'averageDisbursementTime',
        type: 'int',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'processingTimeDescription',
      new TableColumn({
        name: 'processingTimeDescription',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add product category & classification
    await addColumnIfNotExists(
      'loanCategory',
      new TableColumn({
        name: 'loanCategory',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'productType',
      new TableColumn({
        name: 'productType',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'useCases',
      new TableColumn({
        name: 'useCases',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'competitiveAdvantages',
      new TableColumn({
        name: 'competitiveAdvantages',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'comparisonNotes',
      new TableColumn({
        name: 'comparisonNotes',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add application requirements
    await addColumnIfNotExists(
      'applicationRequirements',
      new TableColumn({
        name: 'applicationRequirements',
        type: 'text',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'minimumEmploymentDuration',
      new TableColumn({
        name: 'minimumEmploymentDuration',
        type: 'int',
        isNullable: true,
      }),
    );

    await addColumnIfNotExists(
      'requiresCoApplicant',
      new TableColumn({
        name: 'requiresCoApplicant',
        type: 'boolean',
        default: false,
      }),
    );

    await addColumnIfNotExists(
      'requiresGuarantor',
      new TableColumn({
        name: 'requiresGuarantor',
        type: 'boolean',
        default: false,
      }),
    );

    // Refresh table to get updated column list
    const updatedTable = await queryRunner.getTable('loan_products');
    if (!updatedTable) {
      throw new Error('loan_products table not found after adding columns');
    }

    // Add indexes for commonly queried fields (check if they exist first)
    const existingIndices = updatedTable.indices.map((idx) => idx.name);
    
    if (!existingIndices.includes('IDX_loan_products_loanCategory')) {
      await queryRunner.createIndex(
        'loan_products',
        new TableIndex({
          name: 'IDX_loan_products_loanCategory',
          columnNames: ['loanCategory'],
        }),
      );
    }

    if (!existingIndices.includes('IDX_loan_products_productType')) {
      await queryRunner.createIndex(
        'loan_products',
        new TableIndex({
          name: 'IDX_loan_products_productType',
          columnNames: ['productType'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    const table = await queryRunner.getTable('loan_products');
    if (table) {
      const index1 = table.indices.find(
        (idx) => idx.name === 'IDX_loan_products_loanCategory',
      );
      if (index1) {
        await queryRunner.dropIndex('loan_products', 'IDX_loan_products_loanCategory');
      }

      const index2 = table.indices.find(
        (idx) => idx.name === 'IDX_loan_products_productType',
      );
      if (index2) {
        await queryRunner.dropIndex('loan_products', 'IDX_loan_products_productType');
      }
    }

    // Remove columns in reverse order
    const columnsToRemove = [
      'requiresGuarantor',
      'requiresCoApplicant',
      'minimumEmploymentDuration',
      'applicationRequirements',
      'comparisonNotes',
      'competitiveAdvantages',
      'useCases',
      'productType',
      'loanCategory',
      'processingTimeDescription',
      'averageDisbursementTime',
      'averageProcessingTime',
      'prepaymentCharges',
      'allowsTopUp',
      'allowsRefinancing',
      'allowsPartialPrepayment',
      'allowsPrepayment',
      'productIconUrl',
      'promotionalBannerUrl',
      'productImages',
      'faqs',
      'howItWorks',
      'targetAudience',
      'benefits',
      'keyFeatures',
      'productHighlights',
      'shortDescription',
      'productTagline',
      'collateralRequirements',
      'requiresCollateral',
      'eligibleRegions',
      'eligibleCountries',
      'requiredDocuments',
      'employmentTypes',
      'maximumDebtToIncomeRatio',
      'minimumCreditScore',
      'minimumAnnualIncome',
      'minimumMonthlyIncome',
      'maximumAge',
      'minimumAge',
      'maximumTerm',
      'minimumTerm',
      'minimumLoanAmount',
    ];

    for (const columnName of columnsToRemove) {
      const column = table?.findColumnByName(columnName);
      if (column) {
        await queryRunner.dropColumn('loan_products', columnName);
      }
    }
  }
}

