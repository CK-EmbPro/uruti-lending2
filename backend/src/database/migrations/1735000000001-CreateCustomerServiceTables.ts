import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCustomerServiceTables1735000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_extensions table
    await queryRunner.createTable(
      new Table({
        name: 'payment_extensions',
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
            name: 'requestDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'originalDueDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'newDueDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'extensionDays',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Pending'",
          },
          {
            name: 'extensionType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'requestReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'hardshipDetails',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'approved',
            type: 'boolean',
            default: false,
          },
          {
            name: 'approvedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'approvedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'approvedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'approvalRemarks',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'denialReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'requestedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'requestedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'processedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'processedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'borrowerNotified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'borrowerNotifiedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'remarks',
            type: 'varchar',
            length: '255',
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
      'payment_extensions',
      new TableIndex({
        name: 'IDX_payment_extensions_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'payment_extensions',
      new TableIndex({
        name: 'IDX_payment_extensions_requestDate',
        columnNames: ['requestDate'],
      }),
    );

    await queryRunner.createIndex(
      'payment_extensions',
      new TableIndex({
        name: 'IDX_payment_extensions_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createForeignKey(
      'payment_extensions',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    // Create disputes table
    await queryRunner.createTable(
      new Table({
        name: 'disputes',
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
            name: 'disputeDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'disputeType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Open'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'disputedAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'disputedChargeId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'disputedChargeType',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'borrowerStatement',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'supportingDocuments',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reportedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'reportedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'assignedTo',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'assignedToId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'investigationStartDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'resolutionDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'escalated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'escalatedTo',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'escalatedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'escalationReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'remarks',
            type: 'varchar',
            length: '255',
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
      'disputes',
      new TableIndex({
        name: 'IDX_disputes_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'IDX_disputes_disputeDate',
        columnNames: ['disputeDate'],
      }),
    );

    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'IDX_disputes_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createForeignKey(
      'disputes',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    // Create dispute_resolutions table
    await queryRunner.createTable(
      new Table({
        name: 'dispute_resolutions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'disputeId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'resolutionDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'resolutionType',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'resolutionDetails',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'adjustmentAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'accountUpdated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'accountUpdatedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'resolvedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'resolvedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'borrowerNotified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'borrowerNotifiedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'notificationMethod',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'remarks',
            type: 'varchar',
            length: '255',
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
      'dispute_resolutions',
      new TableIndex({
        name: 'IDX_dispute_resolutions_disputeId',
        columnNames: ['disputeId'],
      }),
    );

    await queryRunner.createIndex(
      'dispute_resolutions',
      new TableIndex({
        name: 'IDX_dispute_resolutions_resolutionDate',
        columnNames: ['resolutionDate'],
      }),
    );

    await queryRunner.createForeignKey(
      'dispute_resolutions',
      new TableForeignKey({
        columnNames: ['disputeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'disputes',
        onDelete: 'CASCADE',
      }),
    );

    // Create account_updates table
    await queryRunner.createTable(
      new Table({
        name: 'account_updates',
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
            name: 'updateDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'updateType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'identityVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'verificationMethod',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'verifiedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'verifiedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'verifiedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'oldAddress',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'oldCity',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'oldState',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'oldZipCode',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'oldCountry',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'oldPhone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'oldEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'newAddress',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'newCity',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'newState',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'newZipCode',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'newCountry',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'newPhone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'newEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'temporary',
            type: 'boolean',
            default: false,
          },
          {
            name: 'temporaryUntil',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'systemValidated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'systemValidatedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'borrowerConfirmed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'borrowerConfirmedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'requestedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'requestedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'processedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'processedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'remarks',
            type: 'varchar',
            length: '255',
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
      'account_updates',
      new TableIndex({
        name: 'IDX_account_updates_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'account_updates',
      new TableIndex({
        name: 'IDX_account_updates_updateDate',
        columnNames: ['updateDate'],
      }),
    );

    await queryRunner.createIndex(
      'account_updates',
      new TableIndex({
        name: 'IDX_account_updates_updateType',
        columnNames: ['updateType'],
      }),
    );

    await queryRunner.createForeignKey(
      'account_updates',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    // Create fee_waivers table
    await queryRunner.createTable(
      new Table({
        name: 'fee_waivers',
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
            name: 'requestDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Pending'",
          },
          {
            name: 'waiverType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'feeType',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'feeAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'feeReferenceId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'requestReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'accountHistory',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'approved',
            type: 'boolean',
            default: false,
          },
          {
            name: 'approvedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'approvedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'approvedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'approvalRemarks',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'denialReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'processed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'processedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'adjustmentReferenceId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'requestedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'requestedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'processedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'processedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'remarks',
            type: 'varchar',
            length: '255',
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
      'fee_waivers',
      new TableIndex({
        name: 'IDX_fee_waivers_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'fee_waivers',
      new TableIndex({
        name: 'IDX_fee_waivers_requestDate',
        columnNames: ['requestDate'],
      }),
    );

    await queryRunner.createIndex(
      'fee_waivers',
      new TableIndex({
        name: 'IDX_fee_waivers_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createForeignKey(
      'fee_waivers',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('fee_waivers');
    await queryRunner.dropTable('account_updates');
    await queryRunner.dropTable('dispute_resolutions');
    await queryRunner.dropTable('disputes');
    await queryRunner.dropTable('payment_extensions');
  }
}

