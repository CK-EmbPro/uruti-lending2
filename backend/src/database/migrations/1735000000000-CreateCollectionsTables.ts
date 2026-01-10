import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCollectionsTables1735000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create delinquency_records table
    await queryRunner.createTable(
      new Table({
        name: 'delinquency_records',
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
            name: 'recordDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'daysPastDue',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'collectionStage',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'outstandingBalance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'lateFeeAssessed',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'lateFeeWaived',
            type: 'boolean',
            default: false,
          },
          {
            name: 'lateFeeWaiverReason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'creditBureauUpdated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'creditBureauUpdateDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'collectionWorkflowTriggered',
            type: 'boolean',
            default: false,
          },
          {
            name: 'remarks',
            type: 'text',
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
      'delinquency_records',
      new TableIndex({
        name: 'IDX_delinquency_records_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'delinquency_records',
      new TableIndex({
        name: 'IDX_delinquency_records_recordDate',
        columnNames: ['recordDate'],
      }),
    );

    await queryRunner.createForeignKey(
      'delinquency_records',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    // Create late_fees table
    await queryRunner.createTable(
      new Table({
        name: 'late_fees',
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
            name: 'delinquencyRecordId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'assessedDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'feeAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'daysPastDue',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'feeCalculationMethod',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'waived',
            type: 'boolean',
            default: false,
          },
          {
            name: 'waiverReason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'waivedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'waivedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'paid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'paidDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'remarks',
            type: 'text',
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

    await queryRunner.createForeignKey(
      'late_fees',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    // Create credit_bureau_updates table
    await queryRunner.createTable(
      new Table({
        name: 'credit_bureau_updates',
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
            name: 'delinquencyRecordId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updateDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'reportStatus',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'dataSent',
            type: 'text',
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

    await queryRunner.createForeignKey(
      'credit_bureau_updates',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    // Create collection_workflows table
    await queryRunner.createTable(
      new Table({
        name: 'collection_workflows',
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
            name: 'startDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'currentStage',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'daysPastDue',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'endDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'assignedCollector',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'assignedCollectorId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'noticeCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'activityCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'lastActivityDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'nextFollowUpDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'skipDays',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'remarks',
            type: 'text',
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

    await queryRunner.createForeignKey(
      'collection_workflows',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    // Create collection_notices table
    await queryRunner.createTable(
      new Table({
        name: 'collection_notices',
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
            name: 'collectionWorkflowId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'noticeType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'sentDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'scheduledDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'daysPastDue',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'outstandingBalance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'recipientEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'recipientPhone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'recipientAddress',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
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

    await queryRunner.createForeignKey(
      'collection_notices',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    // Create collection_activities table
    await queryRunner.createTable(
      new Table({
        name: 'collection_activities',
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
            name: 'workflowId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'activityType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'activityDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'activityTime',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'performedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'performedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'conversationNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rightPartyContact',
            type: 'boolean',
            default: false,
          },
          {
            name: 'ceaseAndDesist',
            type: 'boolean',
            default: false,
          },
          {
            name: 'contactPhone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'contactEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'contactAddress',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'callDuration',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'callbackRequested',
            type: 'boolean',
            default: false,
          },
          {
            name: 'callbackDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'outcome',
            type: 'varchar',
            length: '100',
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

    await queryRunner.createForeignKey(
      'collection_activities',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'collection_activities',
      new TableForeignKey({
        columnNames: ['workflowId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'collection_workflows',
        onDelete: 'SET NULL',
      }),
    );

    // Create promise_to_pay table
    await queryRunner.createTable(
      new Table({
        name: 'promise_to_pay',
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
            name: 'collectionActivityId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'promiseDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'promisedAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'dueDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'fulfilled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'fulfilledDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'paidAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'defaulted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'defaultedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'promisedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'contactPhone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'contactEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdById',
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

    await queryRunner.createForeignKey(
      'promise_to_pay',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'promise_to_pay',
      new TableForeignKey({
        columnNames: ['collectionActivityId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'collection_activities',
        onDelete: 'SET NULL',
      }),
    );

    // Create payment_arrangements table
    await queryRunner.createTable(
      new Table({
        name: 'payment_arrangements',
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
            name: 'collectionActivityId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'startDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'endDate',
            type: 'date',
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
            name: 'totalAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'paidAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'numberOfPayments',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'paymentsMade',
            type: 'int',
            default: 0,
          },
          {
            name: 'paymentAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'paymentFrequency',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'paymentDay',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'shortTerm',
            type: 'boolean',
            default: false,
          },
          {
            name: 'longTerm',
            type: 'boolean',
            default: false,
          },
          {
            name: 'terms',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'conditions',
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
            name: 'missedPayments',
            type: 'int',
            default: 0,
          },
          {
            name: 'latePayments',
            type: 'int',
            default: 0,
          },
          {
            name: 'lastPaymentDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'nextPaymentDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdById',
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

    await queryRunner.createForeignKey(
      'payment_arrangements',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payment_arrangements',
      new TableForeignKey({
        columnNames: ['collectionActivityId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'collection_activities',
        onDelete: 'SET NULL',
      }),
    );

    // Create arrangement_compliance table
    await queryRunner.createTable(
      new Table({
        name: 'arrangement_compliance',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'arrangementId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'dueDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'dueAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'paid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'paidAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'missed',
            type: 'boolean',
            default: false,
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

    await queryRunner.createForeignKey(
      'arrangement_compliance',
      new TableForeignKey({
        columnNames: ['arrangementId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payment_arrangements',
        onDelete: 'CASCADE',
      }),
    );

    // Create skip_traces table
    await queryRunner.createTable(
      new Table({
        name: 'skip_traces',
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
            name: 'collectionActivityId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'initiatedDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'initiatedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'initiatedById',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'oldContactPhone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'oldContactEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'oldAddress',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'newContactPhone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'newContactEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'newAddress',
            type: 'text',
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
            name: 'searchMethod',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'thirdPartyService',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'thirdPartyReference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'searchCost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'contactFound',
            type: 'boolean',
            default: false,
          },
          {
            name: 'contactFoundDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'contactVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'contactVerifiedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'newContactAttempted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'newContactAttemptDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'newContactSuccessful',
            type: 'boolean',
            default: false,
          },
          {
            name: 'searchResults',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
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

    await queryRunner.createForeignKey(
      'skip_traces',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'skip_traces',
      new TableForeignKey({
        columnNames: ['collectionActivityId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'collection_activities',
        onDelete: 'SET NULL',
      }),
    );

    // Create legal_actions table
    await queryRunner.createTable(
      new Table({
        name: 'legal_actions',
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
            name: 'actionType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'initiatedDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'attorneyId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'approvalDate',
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

    await queryRunner.createForeignKey(
      'legal_actions',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    // Create lawsuits table
    await queryRunner.createTable(
      new Table({
        name: 'lawsuits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'legalActionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'caseNumber',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'court',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'filingDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'judgmentDate',
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

    await queryRunner.createForeignKey(
      'lawsuits',
      new TableForeignKey({
        columnNames: ['legalActionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'legal_actions',
        onDelete: 'CASCADE',
      }),
    );

    // Create judgments table
    await queryRunner.createTable(
      new Table({
        name: 'judgments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'lawsuitId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'judgmentDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'judgmentAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'recoveryAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
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

    await queryRunner.createForeignKey(
      'judgments',
      new TableForeignKey({
        columnNames: ['lawsuitId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lawsuits',
        onDelete: 'CASCADE',
      }),
    );

    // Create collection_agencies table
    await queryRunner.createTable(
      new Table({
        name: 'collection_agencies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'agencyType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'contactPerson',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'commissionRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
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

    // Create third_party_placements table
    await queryRunner.createTable(
      new Table({
        name: 'third_party_placements',
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
            name: 'agencyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'placementDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'placementAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'recoveryAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
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

    await queryRunner.createForeignKey(
      'third_party_placements',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'third_party_placements',
      new TableForeignKey({
        columnNames: ['agencyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'collection_agencies',
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('third_party_placements');
    await queryRunner.dropTable('collection_agencies');
    await queryRunner.dropTable('judgments');
    await queryRunner.dropTable('lawsuits');
    await queryRunner.dropTable('legal_actions');
    await queryRunner.dropTable('skip_traces');
    await queryRunner.dropTable('arrangement_compliance');
    await queryRunner.dropTable('payment_arrangements');
    await queryRunner.dropTable('promise_to_pay');
    await queryRunner.dropTable('collection_activities');
    await queryRunner.dropTable('collection_notices');
    await queryRunner.dropTable('collection_workflows');
    await queryRunner.dropTable('credit_bureau_updates');
    await queryRunner.dropTable('late_fees');
    await queryRunner.dropTable('delinquency_records');
  }
}

