import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateRevenueBasedRepaymentTables1766200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create revenue_tracking table
    await queryRunner.createTable(
      new Table({
        name: 'revenue_tracking',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'loanId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'companyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'revenueAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'revenueDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'source',
            type: 'enum',
            enum: ['PAYMENT_GATEWAY', 'ACCOUNTING_SYSTEM', 'BANK_STATEMENT', 'MANUAL_ENTRY', 'API_INTEGRATION'],
            isNullable: false,
          },
          {
            name: 'sourceIntegrationId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'externalReferenceId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'VERIFIED', 'DISCREPANCY', 'REJECTED'],
            default: "'PENDING'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'verificationData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create revenue_based_repayment_config table
    await queryRunner.createTable(
      new Table({
        name: 'revenue_based_repayment_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'loanId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'loanProductId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'companyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'repaymentPercentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'revenuePeriod',
            type: 'enum',
            enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'],
            default: "'MONTHLY'",
          },
          {
            name: 'minimumRepaymentAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'maximumRepaymentAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'revenueSources',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'requireVerification',
            type: 'boolean',
            default: true,
          },
          {
            name: 'autoCalculate',
            type: 'boolean',
            default: true,
          },
          {
            name: 'verificationThreshold',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create revenue_verifications table
    await queryRunner.createTable(
      new Table({
        name: 'revenue_verifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'loanId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'revenueTrackingId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'companyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reportedRevenue',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'reportedDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'bankStatementAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'bankStatementDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'bankAccountId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'bankTransactionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'VERIFIED', 'DISCREPANCY', 'REJECTED'],
            default: "'PENDING'",
          },
          {
            name: 'discrepancyType',
            type: 'enum',
            enum: ['AMOUNT_MISMATCH', 'DATE_MISMATCH', 'MISSING_TRANSACTION', 'DUPLICATE_TRANSACTION'],
            isNullable: true,
          },
          {
            name: 'discrepancyAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'discrepancyPercentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'verifiedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'verifiedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'verificationDetails',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex('revenue_tracking', new TableIndex({ name: 'IDX_REVENUE_TRACKING_LOAN', columnNames: ['loanId'] }));
    await queryRunner.createIndex('revenue_tracking', new TableIndex({ name: 'IDX_REVENUE_TRACKING_DATE', columnNames: ['revenueDate'] }));
    await queryRunner.createIndex('revenue_tracking', new TableIndex({ name: 'IDX_REVENUE_TRACKING_SOURCE', columnNames: ['source'] }));
    await queryRunner.createIndex('revenue_tracking', new TableIndex({ name: 'IDX_REVENUE_TRACKING_STATUS', columnNames: ['status'] }));

    await queryRunner.createIndex('revenue_based_repayment_config', new TableIndex({ name: 'IDX_REVENUE_CONFIG_LOAN', columnNames: ['loanId'], isUnique: true }));
    await queryRunner.createIndex('revenue_based_repayment_config', new TableIndex({ name: 'IDX_REVENUE_CONFIG_PRODUCT', columnNames: ['loanProductId'] }));

    await queryRunner.createIndex('revenue_verifications', new TableIndex({ name: 'IDX_REVENUE_VERIFICATION_LOAN', columnNames: ['loanId'] }));
    await queryRunner.createIndex('revenue_verifications', new TableIndex({ name: 'IDX_REVENUE_VERIFICATION_TRACKING', columnNames: ['revenueTrackingId'] }));
    await queryRunner.createIndex('revenue_verifications', new TableIndex({ name: 'IDX_REVENUE_VERIFICATION_STATUS', columnNames: ['status'] }));
    await queryRunner.createIndex('revenue_verifications', new TableIndex({ name: 'IDX_REVENUE_VERIFICATION_DATE', columnNames: ['reportedDate'] }));

    // Create foreign keys
    await queryRunner.createForeignKey(
      'revenue_tracking',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'revenue_based_repayment_config',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'revenue_based_repayment_config',
      new TableForeignKey({
        columnNames: ['loanProductId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loan_products',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'revenue_verifications',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'revenue_verifications',
      new TableForeignKey({
        columnNames: ['revenueTrackingId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'revenue_tracking',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('revenue_verifications', true);
    await queryRunner.dropTable('revenue_based_repayment_config', true);
    await queryRunner.dropTable('revenue_tracking', true);
  }
}

