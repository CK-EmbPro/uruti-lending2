import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateReportingAnalyticsTables1735000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create portfolio_metrics table
    await queryRunner.createTable(
      new Table({
        name: 'portfolio_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'reportDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'companyId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'loanProductId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'totalLoans',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'totalDisbursed',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'totalOutstanding',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'totalDelinquentLoans',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'totalDelinquentAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'delinquencyRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'totalInterestEarned',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'totalFeesEarned',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'totalWriteOffs',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'netProfitMargin',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'byProduct',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'byStatus',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'byDelinquencyStage',
            type: 'jsonb',
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
      'portfolio_metrics',
      new TableIndex({
        name: 'IDX_portfolio_metrics_reportDate',
        columnNames: ['reportDate'],
      }),
    );

    await queryRunner.createIndex(
      'portfolio_metrics',
      new TableIndex({
        name: 'IDX_portfolio_metrics_companyId',
        columnNames: ['companyId'],
      }),
    );

    // Create regulatory_reports table
    await queryRunner.createTable(
      new Table({
        name: 'regulatory_reports',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'reportType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'reportDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'periodStartDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'periodEndDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'DRAFT'",
          },
          {
            name: 'companyId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reportData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isValid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'validationErrors',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reviewedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reviewedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'submittedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'submittedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'regulatorName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'submissionReference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'remarks',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'filePath',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'fileName',
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
      'regulatory_reports',
      new TableIndex({
        name: 'IDX_regulatory_reports_reportType',
        columnNames: ['reportType'],
      }),
    );

    await queryRunner.createIndex(
      'regulatory_reports',
      new TableIndex({
        name: 'IDX_regulatory_reports_reportDate',
        columnNames: ['reportDate'],
      }),
    );

    await queryRunner.createIndex(
      'regulatory_reports',
      new TableIndex({
        name: 'IDX_regulatory_reports_status',
        columnNames: ['status'],
      }),
    );

    // Create roll_rate_analyses table
    await queryRunner.createTable(
      new Table({
        name: 'roll_rate_analyses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'analysisType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'ROLL_RATE'",
          },
          {
            name: 'analysisDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'periodStartDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'periodEndDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'companyId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'loanProductId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'rollRateMatrix',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'currentTo30Days',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'days30To60Days',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'days60To90Days',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'days90To180Days',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'days180To365Days',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'days365Plus',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'forecastedLosses',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'lossRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'trends',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'vintageData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'cohortData',
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

    await queryRunner.createIndex(
      'roll_rate_analyses',
      new TableIndex({
        name: 'IDX_roll_rate_analyses_analysisDate',
        columnNames: ['analysisDate'],
      }),
    );

    await queryRunner.createIndex(
      'roll_rate_analyses',
      new TableIndex({
        name: 'IDX_roll_rate_analyses_analysisType',
        columnNames: ['analysisType'],
      }),
    );

    // Create fair_lending_analyses table
    await queryRunner.createTable(
      new Table({
        name: 'fair_lending_analyses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'analysisType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'APPROVAL_RATE'",
          },
          {
            name: 'analysisDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'periodStartDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'periodEndDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'companyId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'loanProductId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'protectedClassData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'overallApprovalRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'approvalRatesByClass',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'pricingDisparities',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'significantDisparities',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'maxDisparityRatio',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'maxDisparityClass',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'reviewed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'reviewedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reviewedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'correctiveActionRequired',
            type: 'boolean',
            default: false,
          },
          {
            name: 'correctiveActionPlan',
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

    await queryRunner.createIndex(
      'fair_lending_analyses',
      new TableIndex({
        name: 'IDX_fair_lending_analyses_analysisDate',
        columnNames: ['analysisDate'],
      }),
    );

    await queryRunner.createIndex(
      'fair_lending_analyses',
      new TableIndex({
        name: 'IDX_fair_lending_analyses_analysisType',
        columnNames: ['analysisType'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('fair_lending_analyses', true);
    await queryRunner.dropTable('roll_rate_analyses', true);
    await queryRunner.dropTable('regulatory_reports', true);
    await queryRunner.dropTable('portfolio_metrics', true);
  }
}

