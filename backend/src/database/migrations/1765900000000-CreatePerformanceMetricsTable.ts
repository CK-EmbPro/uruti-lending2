import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePerformanceMetricsTable1765900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'performance_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'endpoint',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'latencyMs',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'success',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'companyId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'performance_metrics',
      new TableIndex({
        name: 'IDX_performance_metrics_endpoint_timestamp',
        columnNames: ['endpoint', 'timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'performance_metrics',
      new TableIndex({
        name: 'IDX_performance_metrics_companyId_timestamp',
        columnNames: ['companyId', 'timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'performance_metrics',
      new TableIndex({
        name: 'IDX_performance_metrics_success_timestamp',
        columnNames: ['success', 'timestamp'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('performance_metrics');
  }
}

