import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDecisionProgressTable1737000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'decision_progress',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'applicationId',
            type: 'varchar',
          },
          {
            name: 'currentStep',
            type: 'varchar',
          },
          {
            name: 'status',
            type: 'varchar',
          },
          {
            name: 'progressPercentage',
            type: 'int',
            default: 0,
          },
          {
            name: 'elapsedTime',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'estimatedTimeRemaining',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'steps',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'slaCompliant',
            type: 'boolean',
            default: true,
          },
          {
            name: 'slaViolations',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'totalSlaTarget',
            type: 'bigint',
            default: 600000,
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
            name: 'result',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'decision_progress',
      new TableIndex({
        name: 'IDX_decision_progress_applicationId',
        columnNames: ['applicationId'],
      }),
    );

    await queryRunner.createIndex(
      'decision_progress',
      new TableIndex({
        name: 'IDX_decision_progress_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'decision_progress',
      new TableIndex({
        name: 'IDX_decision_progress_createdAt',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('decision_progress');
  }
}

