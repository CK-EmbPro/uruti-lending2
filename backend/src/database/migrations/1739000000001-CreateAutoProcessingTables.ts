import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAutoProcessingTables1739000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create auto_disbursements table
    await queryRunner.createTable(
      new Table({
        name: 'auto_disbursements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'loanId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'PENDING'",
          },
          {
            name: 'method',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'accountVerificationStatus',
            type: 'varchar',
            length: '50',
            default: "'PENDING'",
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'accountDetails',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'attemptCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'attempts',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'processingTimeMs',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'externalReference',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'failureReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'failedAt',
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
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'auto_disbursements',
      new TableIndex({
        name: 'IDX_auto_disbursements_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'auto_disbursements',
      new TableIndex({
        name: 'IDX_auto_disbursements_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'auto_disbursements',
      new TableIndex({
        name: 'IDX_auto_disbursements_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Create stp_metrics table
    await queryRunner.createTable(
      new Table({
        name: 'stp_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'entityId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'processingType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'segment',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'autoProcessed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'manualTriggers',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'processedAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'processingTimeMs',
            type: 'bigint',
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

    await queryRunner.createIndex(
      'stp_metrics',
      new TableIndex({
        name: 'IDX_stp_metrics_entityId_processingType',
        columnNames: ['entityId', 'processingType'],
      }),
    );

    await queryRunner.createIndex(
      'stp_metrics',
      new TableIndex({
        name: 'IDX_stp_metrics_segment_createdAt',
        columnNames: ['segment', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'stp_metrics',
      new TableIndex({
        name: 'IDX_stp_metrics_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Create manual_review_queue table
    await queryRunner.createTable(
      new Table({
        name: 'manual_review_queue',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'entityId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'processingType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'triggers',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'priorityScore',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'assignedTo',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reviewStartedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'reviewCompletedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'escalated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'escalatedAt',
            type: 'timestamp',
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

    await queryRunner.createIndex(
      'manual_review_queue',
      new TableIndex({
        name: 'IDX_manual_review_queue_priority_createdAt',
        columnNames: ['priority', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'manual_review_queue',
      new TableIndex({
        name: 'IDX_manual_review_queue_assignedTo_createdAt',
        columnNames: ['assignedTo', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'manual_review_queue',
      new TableIndex({
        name: 'IDX_manual_review_queue_processingType',
        columnNames: ['processingType'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('manual_review_queue');
    await queryRunner.dropTable('stp_metrics');
    await queryRunner.dropTable('auto_disbursements');
  }
}

