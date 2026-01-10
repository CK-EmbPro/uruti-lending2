import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateWorkflowExceptionTables1735000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tasks table
    await queryRunner.createTable(
      new Table({
        name: 'tasks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'taskType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Other'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Pending'",
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Medium'",
          },
          {
            name: 'assignedTo',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'assignedByName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'assignedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdByName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'relatedEntityType',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'relatedEntityId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'dueDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'startedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'slaHours',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'slaDueDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'isEscalated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'escalatedTo',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'escalatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'escalationReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'comments',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'attachments',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'resolutionNotes',
            type: 'text',
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

    // Create indexes for tasks
    await queryRunner.createIndex(
      'tasks',
      new TableIndex({
        name: 'IDX_tasks_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'tasks',
      new TableIndex({
        name: 'IDX_tasks_assignedTo',
        columnNames: ['assignedTo'],
      }),
    );
    await queryRunner.createIndex(
      'tasks',
      new TableIndex({
        name: 'IDX_tasks_createdBy',
        columnNames: ['createdBy'],
      }),
    );
    await queryRunner.createIndex(
      'tasks',
      new TableIndex({
        name: 'IDX_tasks_dueDate',
        columnNames: ['dueDate'],
      }),
    );
    await queryRunner.createIndex(
      'tasks',
      new TableIndex({
        name: 'IDX_tasks_priority',
        columnNames: ['priority'],
      }),
    );

    // Create sla_trackings table
    await queryRunner.createTable(
      new Table({
        name: 'sla_trackings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'taskId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'taskTitle',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'slaHours',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'slaStartDate',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'slaDueDate',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'On Track'",
          },
          {
            name: 'breached',
            type: 'boolean',
            default: false,
          },
          {
            name: 'breachedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'alertBeforeHours',
            type: 'int',
            default: 24,
          },
          {
            name: 'alertSent',
            type: 'boolean',
            default: false,
          },
          {
            name: 'alertSentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'escalationAlertSent',
            type: 'boolean',
            default: false,
          },
          {
            name: 'escalationAlertSentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'assignedTo',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'assignedToName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'escalatedTo',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'escalatedToName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'escalatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'escalationReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'actualHours',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'breachMinutes',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'statusHistory',
            type: 'jsonb',
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

    // Create foreign key for sla_trackings.taskId
    await queryRunner.createForeignKey(
      'sla_trackings',
      new TableForeignKey({
        columnNames: ['taskId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for sla_trackings
    await queryRunner.createIndex(
      'sla_trackings',
      new TableIndex({
        name: 'IDX_sla_trackings_taskId',
        columnNames: ['taskId'],
      }),
    );
    await queryRunner.createIndex(
      'sla_trackings',
      new TableIndex({
        name: 'IDX_sla_trackings_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'sla_trackings',
      new TableIndex({
        name: 'IDX_sla_trackings_slaDueDate',
        columnNames: ['slaDueDate'],
      }),
    );
    await queryRunner.createIndex(
      'sla_trackings',
      new TableIndex({
        name: 'IDX_sla_trackings_breached',
        columnNames: ['breached'],
      }),
    );

    // Create bulk_operations table
    await queryRunner.createTable(
      new Table({
        name: 'bulk_operations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'operationName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'operationType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Draft'",
          },
          {
            name: 'selectionCriteria',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'estimatedAffectedCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'actualAffectedCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'operationDetails',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'operationDescription',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'previewData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'previewGenerated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'previewGeneratedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'approvedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approvedByName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'approvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'approvalNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'executedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'executedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'executionDurationSeconds',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'executionResults',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reportPath',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reportGenerated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'reportGeneratedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdByName',
            type: 'varchar',
            length: '255',
            isNullable: false,
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

    // Create indexes for bulk_operations
    await queryRunner.createIndex(
      'bulk_operations',
      new TableIndex({
        name: 'IDX_bulk_operations_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'bulk_operations',
      new TableIndex({
        name: 'IDX_bulk_operations_operationType',
        columnNames: ['operationType'],
      }),
    );
    await queryRunner.createIndex(
      'bulk_operations',
      new TableIndex({
        name: 'IDX_bulk_operations_createdBy',
        columnNames: ['createdBy'],
      }),
    );
    await queryRunner.createIndex(
      'bulk_operations',
      new TableIndex({
        name: 'IDX_bulk_operations_executedAt',
        columnNames: ['executedAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('bulk_operations', true);
    await queryRunner.dropTable('sla_trackings', true);
    await queryRunner.dropTable('tasks', true);
  }
}

