import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePartialRepaymentRestructuringTables1766300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_holidays table
    await queryRunner.createTable(
      new Table({
        name: 'payment_holidays',
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
            name: 'modificationId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'companyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'startDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'endDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'durationMonths',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
            default: "'ACTIVE'",
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'approvedBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'approvedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'completedDate',
            type: 'date',
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

    // Create restructure_acknowledgments table
    await queryRunner.createTable(
      new Table({
        name: 'restructure_acknowledgments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'restructureId',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'borrowerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'acknowledgedAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'acknowledgmentMethod',
            type: 'enum',
            enum: ['DIGITAL_SIGNATURE', 'ELECTRONIC_CONSENT', 'DOCUMENT_UPLOAD', 'IN_PERSON'],
            isNullable: false,
          },
          {
            name: 'acknowledgmentText',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'signatureData',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'termsRead',
            type: 'boolean',
            default: false,
          },
          {
            name: 'impactUnderstood',
            type: 'boolean',
            default: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add indexes for payment_holidays
    await queryRunner.createIndex(
      'payment_holidays',
      new TableIndex({
        name: 'IDX_payment_holidays_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'payment_holidays',
      new TableIndex({
        name: 'IDX_payment_holidays_startDate',
        columnNames: ['startDate'],
      }),
    );

    await queryRunner.createIndex(
      'payment_holidays',
      new TableIndex({
        name: 'IDX_payment_holidays_status',
        columnNames: ['status'],
      }),
    );

    // Add indexes for restructure_acknowledgments
    await queryRunner.createIndex(
      'restructure_acknowledgments',
      new TableIndex({
        name: 'IDX_restructure_acknowledgments_restructureId',
        columnNames: ['restructureId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'restructure_acknowledgments',
      new TableIndex({
        name: 'IDX_restructure_acknowledgments_acknowledgedAt',
        columnNames: ['acknowledgedAt'],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'payment_holidays',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payment_holidays',
      new TableForeignKey({
        columnNames: ['modificationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loan_modifications',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'restructure_acknowledgments',
      new TableForeignKey({
        columnNames: ['restructureId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loan_restructures',
        onDelete: 'CASCADE',
      }),
    );

    // Add new columns to loan_restructures table
    await queryRunner.query(`
      ALTER TABLE loan_restructures
      ADD COLUMN IF NOT EXISTS "oldScheduleSummary" JSONB,
      ADD COLUMN IF NOT EXISTS "newScheduleSummary" JSONB,
      ADD COLUMN IF NOT EXISTS "impactAnalysis" JSONB,
      ADD COLUMN IF NOT EXISTS "borrowerAcknowledged" BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS "acknowledgedAt" TIMESTAMP;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from loan_restructures
    await queryRunner.query(`
      ALTER TABLE loan_restructures
      DROP COLUMN IF EXISTS "oldScheduleSummary",
      DROP COLUMN IF EXISTS "newScheduleSummary",
      DROP COLUMN IF EXISTS "impactAnalysis",
      DROP COLUMN IF EXISTS "borrowerAcknowledged",
      DROP COLUMN IF EXISTS "acknowledgedAt";
    `);

    // Drop foreign keys
    await queryRunner.dropForeignKey('restructure_acknowledgments', 'FK_restructure_acknowledgments_restructureId');
    await queryRunner.dropForeignKey('payment_holidays', 'FK_payment_holidays_modificationId');
    await queryRunner.dropForeignKey('payment_holidays', 'FK_payment_holidays_loanId');

    // Drop indexes
    await queryRunner.dropIndex('restructure_acknowledgments', 'IDX_restructure_acknowledgments_acknowledgedAt');
    await queryRunner.dropIndex('restructure_acknowledgments', 'IDX_restructure_acknowledgments_restructureId');
    await queryRunner.dropIndex('payment_holidays', 'IDX_payment_holidays_status');
    await queryRunner.dropIndex('payment_holidays', 'IDX_payment_holidays_startDate');
    await queryRunner.dropIndex('payment_holidays', 'IDX_payment_holidays_loanId');

    // Drop tables
    await queryRunner.dropTable('restructure_acknowledgments');
    await queryRunner.dropTable('payment_holidays');
  }
}

