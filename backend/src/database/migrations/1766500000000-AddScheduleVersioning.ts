import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Migration: Add Schedule Versioning
 * 
 * Adds version tracking and restructure linking to loan repayment schedules
 * - version: Schedule version number (default: 1)
 * - restructureId: Foreign key to loan_restructures table
 */
export class AddScheduleVersioning1766500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add version column
    await queryRunner.addColumn(
      'loan_repayment_schedules',
      new TableColumn({
        name: 'version',
        type: 'int',
        default: 1,
        isNullable: false,
      }),
    );

    // Add restructureId column
    await queryRunner.addColumn(
      'loan_repayment_schedules',
      new TableColumn({
        name: 'restructureId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Create index on version for faster queries
    await queryRunner.query(`
      CREATE INDEX "IDX_loan_repayment_schedules_version" 
      ON "loan_repayment_schedules" ("version")
    `);

    // Create index on restructureId for faster joins
    await queryRunner.query(`
      CREATE INDEX "IDX_loan_repayment_schedules_restructureId" 
      ON "loan_repayment_schedules" ("restructureId")
    `);

    // Create composite index for querying schedules by loan and version
    await queryRunner.query(`
      CREATE INDEX "IDX_loan_repayment_schedules_loanId_version" 
      ON "loan_repayment_schedules" ("loanId", "version")
    `);

    // Add foreign key constraint to loan_restructures
    await queryRunner.createForeignKey(
      'loan_repayment_schedules',
      new TableForeignKey({
        columnNames: ['restructureId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loan_restructures',
        onDelete: 'SET NULL', // Keep schedule history even if restructure is deleted
        onUpdate: 'CASCADE',
      }),
    );

    // Backfill version numbers for existing schedules
    // All existing schedules get version 1
    await queryRunner.query(`
      UPDATE "loan_repayment_schedules"
      SET "version" = 1
      WHERE "version" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('loan_repayment_schedules');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('restructureId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('loan_repayment_schedules', foreignKey);
    }

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_loan_repayment_schedules_loanId_version"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_loan_repayment_schedules_restructureId"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_loan_repayment_schedules_version"
    `);

    // Drop columns
    await queryRunner.dropColumn('loan_repayment_schedules', 'restructureId');
    await queryRunner.dropColumn('loan_repayment_schedules', 'version');
  }
}

