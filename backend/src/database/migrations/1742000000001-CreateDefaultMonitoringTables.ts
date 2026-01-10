import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateDefaultMonitoringTables1742000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create default_risk_scores table
    await queryRunner.createTable(
      new Table({
        name: 'default_risk_scores',
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
            type: 'varchar',
            length: '255',
          },
          {
            name: 'riskScore',
            type: 'int',
          },
          {
            name: 'riskLevel',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'scoreChange',
            type: 'int',
            default: 0,
          },
          {
            name: 'indicators',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'behavioralDrift',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'alertTriggered',
            type: 'boolean',
            default: false,
          },
          {
            name: 'calculatedAt',
            type: 'date',
          },
          {
            name: 'predictedDefaultDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'daysUntilPredictedDefault',
            type: 'int',
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
      'default_risk_scores',
      new TableIndex({
        name: 'IDX_default_risk_scores_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'default_risk_scores',
      new TableIndex({
        name: 'IDX_default_risk_scores_riskLevel',
        columnNames: ['riskLevel'],
      }),
    );

    await queryRunner.createIndex(
      'default_risk_scores',
      new TableIndex({
        name: 'IDX_default_risk_scores_calculatedAt',
        columnNames: ['calculatedAt'],
      }),
    );

    await queryRunner.createIndex(
      'default_risk_scores',
      new TableIndex({
        name: 'IDX_default_risk_scores_alertTriggered',
        columnNames: ['alertTriggered'],
      }),
    );

    // Create pre_default_actions table
    await queryRunner.createTable(
      new Table({
        name: 'pre_default_actions',
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
            type: 'varchar',
            length: '255',
          },
          {
            name: 'actionType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'executed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'executedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'actionDetails',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'riskScoreAtAction',
            type: 'int',
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
      'pre_default_actions',
      new TableIndex({
        name: 'IDX_pre_default_actions_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'pre_default_actions',
      new TableIndex({
        name: 'IDX_pre_default_actions_actionType',
        columnNames: ['actionType'],
      }),
    );

    await queryRunner.createIndex(
      'pre_default_actions',
      new TableIndex({
        name: 'IDX_pre_default_actions_executed',
        columnNames: ['executed'],
      }),
    );

    await queryRunner.createIndex(
      'pre_default_actions',
      new TableIndex({
        name: 'IDX_pre_default_actions_executedAt',
        columnNames: ['executedAt'],
      }),
    );

    // Create behavioral_baselines table
    await queryRunner.createTable(
      new Table({
        name: 'behavioral_baselines',
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
            type: 'varchar',
            length: '255',
          },
          {
            name: 'baselineCycles',
            type: 'int',
          },
          {
            name: 'averageRepaymentDay',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'autoDebitRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'averagePaymentAmount',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'averageAppEngagement',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'totalPayments',
            type: 'int',
          },
          {
            name: 'onTimePayments',
            type: 'int',
          },
          {
            name: 'baselineStartDate',
            type: 'date',
          },
          {
            name: 'baselineEndDate',
            type: 'date',
          },
          {
            name: 'baselineEstablished',
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

    await queryRunner.createIndex(
      'behavioral_baselines',
      new TableIndex({
        name: 'IDX_behavioral_baselines_loanId',
        columnNames: ['loanId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('behavioral_baselines', true);
    await queryRunner.dropTable('pre_default_actions', true);
    await queryRunner.dropTable('default_risk_scores', true);
  }
}

