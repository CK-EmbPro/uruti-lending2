import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateEarlySettlementTables1766400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create early_settlements table
    await queryRunner.createTable(
      new Table({
        name: 'early_settlements',
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
            name: 'companyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'settlementDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'principalBalance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'accruedInterest',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'interestRebate',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'totalPayoffAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'originalPayoffAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'totalSavings',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'monthsRemaining',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'rebatePercentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'PROCESSED', 'CANCELLED'],
            default: "'PENDING'",
          },
          {
            name: 'processedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'processedBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'notes',
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

    // Create early_settlement_daily_calculations table
    await queryRunner.createTable(
      new Table({
        name: 'early_settlement_daily_calculations',
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
            name: 'companyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'calculationDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'principalBalance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'accruedInterest',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'interestRebate',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'totalPayoffAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'originalPayoffAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'savingsAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'monthsRemaining',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'rebatePercentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'dailyChange',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
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

    // Create early_settlement_analytics table
    await queryRunner.createTable(
      new Table({
        name: 'early_settlement_analytics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'companyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'segment',
            type: 'enum',
            enum: ['MICRO', 'SME', 'ENTERPRISE'],
            isNullable: false,
          },
          {
            name: 'periodStart',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'periodEnd',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'totalLoans',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'earlySettlements',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'settlementRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'totalRebateAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'averageRebateAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'averageSavings',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'averageMonthsRemaining',
            type: 'int',
            isNullable: false,
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
      'early_settlements',
      new TableIndex({
        name: 'IDX_early_settlements_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'early_settlements',
      new TableIndex({
        name: 'IDX_early_settlements_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'early_settlements',
      new TableIndex({
        name: 'IDX_early_settlements_settlementDate',
        columnNames: ['settlementDate'],
      }),
    );

    await queryRunner.createIndex(
      'early_settlement_daily_calculations',
      new TableIndex({
        name: 'IDX_daily_calc_loanId_date',
        columnNames: ['loanId', 'calculationDate'],
      }),
    );

    await queryRunner.createIndex(
      'early_settlement_daily_calculations',
      new TableIndex({
        name: 'IDX_daily_calc_loanId',
        columnNames: ['loanId'],
      }),
    );

    await queryRunner.createIndex(
      'early_settlement_analytics',
      new TableIndex({
        name: 'IDX_analytics_company_segment_period',
        columnNames: ['companyId', 'segment', 'periodStart'],
      }),
    );

    await queryRunner.createIndex(
      'early_settlement_analytics',
      new TableIndex({
        name: 'IDX_analytics_companyId',
        columnNames: ['companyId'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'early_settlements',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'early_settlement_daily_calculations',
      new TableForeignKey({
        columnNames: ['loanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loans',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('early_settlement_analytics');
    await queryRunner.dropTable('early_settlement_daily_calculations');
    await queryRunner.dropTable('early_settlements');
  }
}

