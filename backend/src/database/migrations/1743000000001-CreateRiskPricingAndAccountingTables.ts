import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRiskPricingAndAccountingTables1743000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ledger_entries table
    await queryRunner.createTable(
      new Table({
        name: 'ledger_entries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'transactionType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'debitAccount',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'creditAccount',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
          },
          {
            name: 'exchangeRate',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'referenceNumber',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'loanId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'customerId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
          },
          {
            name: 'createdBy',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'source',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'postedAt',
            type: 'timestamp',
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

    await queryRunner.createIndex(
      'ledger_entries',
      new TableIndex({
        name: 'IDX_ledger_entries_referenceNumber',
        columnNames: ['referenceNumber'],
      }),
    );

    await queryRunner.createIndex(
      'ledger_entries',
      new TableIndex({
        name: 'IDX_ledger_entries_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'ledger_entries',
      new TableIndex({
        name: 'IDX_ledger_entries_customerId',
        columnNames: ['customerId'],
      }),
    );

    await queryRunner.createIndex(
      'ledger_entries',
      new TableIndex({
        name: 'IDX_ledger_entries_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'ledger_entries',
      new TableIndex({
        name: 'IDX_ledger_entries_transactionType',
        columnNames: ['transactionType'],
      }),
    );

    await queryRunner.createIndex(
      'ledger_entries',
      new TableIndex({
        name: 'IDX_ledger_entries_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Create payment_mismatches table
    await queryRunner.createTable(
      new Table({
        name: 'payment_mismatches',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'mismatchType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'referenceNumber',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'paymentAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'expectedAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'customerId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'loanId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'suggestedResolution',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'autoAllocated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'resolvedAt',
            type: 'timestamp',
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

    await queryRunner.createIndex(
      'payment_mismatches',
      new TableIndex({
        name: 'IDX_payment_mismatches_referenceNumber',
        columnNames: ['referenceNumber'],
      }),
    );

    await queryRunner.createIndex(
      'payment_mismatches',
      new TableIndex({
        name: 'IDX_payment_mismatches_mismatchType',
        columnNames: ['mismatchType'],
      }),
    );

    await queryRunner.createIndex(
      'payment_mismatches',
      new TableIndex({
        name: 'IDX_payment_mismatches_autoAllocated',
        columnNames: ['autoAllocated'],
      }),
    );

    await queryRunner.createIndex(
      'payment_mismatches',
      new TableIndex({
        name: 'IDX_payment_mismatches_resolvedAt',
        columnNames: ['resolvedAt'],
      }),
    );

    // Create reconciliation_runs table
    await queryRunner.createTable(
      new Table({
        name: 'reconciliation_runs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'reconciliationDate',
            type: 'date',
          },
          {
            name: 'totalLedgerEntries',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalBankTransactions',
            type: 'int',
            default: 0,
          },
          {
            name: 'matchedEntries',
            type: 'int',
            default: 0,
          },
          {
            name: 'unmatchedLedgerEntries',
            type: 'int',
            default: 0,
          },
          {
            name: 'unmatchedBankTransactions',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
          },
          {
            name: 'discrepancies',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'reconciliation_runs',
      new TableIndex({
        name: 'IDX_reconciliation_runs_reconciliationDate',
        columnNames: ['reconciliationDate'],
      }),
    );

    await queryRunner.createIndex(
      'reconciliation_runs',
      new TableIndex({
        name: 'IDX_reconciliation_runs_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('reconciliation_runs', true);
    await queryRunner.dropTable('payment_mismatches', true);
    await queryRunner.dropTable('ledger_entries', true);
  }
}

