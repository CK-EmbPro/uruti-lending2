import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRiskManagementTables1735000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create concentration_risks table
    await queryRunner.createTable(
      new Table({
        name: 'concentration_risks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'assessmentDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'concentrationType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'segmentIdentifier',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'segmentName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'totalExposure',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'portfolioTotal',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'concentrationPercentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'limitPercentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'limitAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'riskLevel',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'LOW'",
          },
          {
            name: 'limitExceeded',
            type: 'boolean',
            default: false,
          },
          {
            name: 'excessPercentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'excessAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'loanBreakdown',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'additionalMetrics',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'actionRequired',
            type: 'boolean',
            default: false,
          },
          {
            name: 'actionTaken',
            type: 'boolean',
            default: false,
          },
          {
            name: 'actionTakenBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'actionTakenAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'correctiveAction',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'remarks',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'companyId',
            type: 'uuid',
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
      'concentration_risks',
      new TableIndex({
        name: 'IDX_concentration_risks_assessmentDate',
        columnNames: ['assessmentDate'],
      }),
    );

    await queryRunner.createIndex(
      'concentration_risks',
      new TableIndex({
        name: 'IDX_concentration_risks_concentrationType',
        columnNames: ['concentrationType'],
      }),
    );

    await queryRunner.createIndex(
      'concentration_risks',
      new TableIndex({
        name: 'IDX_concentration_risks_riskLevel',
        columnNames: ['riskLevel'],
      }),
    );

    // Create stress_tests table
    await queryRunner.createTable(
      new Table({
        name: 'stress_tests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'testName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'testType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'CUSTOM'",
          },
          {
            name: 'testDate',
            type: 'date',
            isNullable: false,
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
            name: 'scenarioParameters',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'portfolioTotal',
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
            name: 'totalLoans',
            type: 'int',
            default: 0,
          },
          {
            name: 'projectedDefaults',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'projectedLosses',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'defaultRate',
            type: 'decimal',
            precision: 5,
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
            name: 'capitalRequired',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'capitalAvailable',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'capitalAdequacyRatio',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '0',
          },
          {
            name: 'resultsBySegment',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'sensitivityAnalysis',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'executedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'executedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'executionTimeMs',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'errorMessage',
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
      'stress_tests',
      new TableIndex({
        name: 'IDX_stress_tests_testDate',
        columnNames: ['testDate'],
      }),
    );

    await queryRunner.createIndex(
      'stress_tests',
      new TableIndex({
        name: 'IDX_stress_tests_testType',
        columnNames: ['testType'],
      }),
    );

    await queryRunner.createIndex(
      'stress_tests',
      new TableIndex({
        name: 'IDX_stress_tests_status',
        columnNames: ['status'],
      }),
    );

    // Create early_warning_signals table
    await queryRunner.createTable(
      new Table({
        name: 'early_warning_signals',
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
            name: 'signalType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'signalDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'severity',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'MEDIUM'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'ACTIVE'",
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
            isNullable: false,
          },
          {
            name: 'signalData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'historicalContext',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'patternDeviation',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'daysSinceLastPayment',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'paymentAmountChange',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'investigatedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'investigatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'investigationNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'requiresAction',
            type: 'boolean',
            default: false,
          },
          {
            name: 'recommendedAction',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'resolvedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'resolvedAt',
            type: 'timestamp',
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

    await queryRunner.createForeignKey(
      'early_warning_signals',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'early_warning_signals',
      new TableIndex({
        name: 'IDX_early_warning_signals_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'early_warning_signals',
      new TableIndex({
        name: 'IDX_early_warning_signals_signalDate',
        columnNames: ['signalDate'],
      }),
    );

    await queryRunner.createIndex(
      'early_warning_signals',
      new TableIndex({
        name: 'IDX_early_warning_signals_signalType',
        columnNames: ['signalType'],
      }),
    );

    await queryRunner.createIndex(
      'early_warning_signals',
      new TableIndex({
        name: 'IDX_early_warning_signals_severity',
        columnNames: ['severity'],
      }),
    );

    await queryRunner.createIndex(
      'early_warning_signals',
      new TableIndex({
        name: 'IDX_early_warning_signals_status',
        columnNames: ['status'],
      }),
    );

    // Create collateral_revaluations table
    await queryRunner.createTable(
      new Table({
        name: 'collateral_revaluations',
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
            name: 'securityId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'revaluationType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'AUTOMATED'",
          },
          {
            name: 'revaluationDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'PENDING'",
          },
          {
            name: 'previousValuation',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'previousValuationDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'newValuation',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'valuationEffectiveDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'valuationChangePercentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'loanAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'outstandingBalance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'previousLTV',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'newLTV',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'ltvChange',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'underCollateralized',
            type: 'boolean',
            default: false,
          },
          {
            name: 'collateralShortfall',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: '0',
          },
          {
            name: 'maxAllowedLTV',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'valuationSource',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'valuationReference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'valuationNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'appraisalDetails',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'initiatedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'initiatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'actionRequired',
            type: 'boolean',
            default: false,
          },
          {
            name: 'requiredAction',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'actionTaken',
            type: 'boolean',
            default: false,
          },
          {
            name: 'actionTakenBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'actionTakenAt',
            type: 'timestamp',
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
      'collateral_revaluations',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'collateral_revaluations',
      new TableIndex({
        name: 'IDX_collateral_revaluations_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'collateral_revaluations',
      new TableIndex({
        name: 'IDX_collateral_revaluations_securityId',
        columnNames: ['securityId'],
      }),
    );

    await queryRunner.createIndex(
      'collateral_revaluations',
      new TableIndex({
        name: 'IDX_collateral_revaluations_revaluationDate',
        columnNames: ['revaluationDate'],
      }),
    );

    await queryRunner.createIndex(
      'collateral_revaluations',
      new TableIndex({
        name: 'IDX_collateral_revaluations_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('collateral_revaluations', true);
    await queryRunner.dropTable('early_warning_signals', true);
    await queryRunner.dropTable('stress_tests', true);
    await queryRunner.dropTable('concentration_risks', true);
  }
}

