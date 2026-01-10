import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUptimeLogsTable1738000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'uptime_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'healthy'",
          },
          {
            name: 'details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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

    // Create indexes
    await queryRunner.createIndex(
      'uptime_logs',
      new TableIndex({
        name: 'IDX_uptime_logs_timestamp',
        columnNames: ['timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'uptime_logs',
      new TableIndex({
        name: 'IDX_uptime_logs_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'uptime_logs',
      new TableIndex({
        name: 'IDX_uptime_logs_timestamp_status',
        columnNames: ['timestamp', 'status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('uptime_logs');
  }
}

