import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCreditScoringToLoanApplication1765800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add credit_score column
    await queryRunner.addColumn(
      'loan_applications',
      new TableColumn({
        name: 'credit_score',
        type: 'int',
        isNullable: true,
        comment: 'Final weighted credit score (300-850)',
      }),
    );

    // Add scoring_details column (JSON)
    await queryRunner.addColumn(
      'loan_applications',
      new TableColumn({
        name: 'scoring_details',
        type: 'jsonb',
        isNullable: true,
        comment: 'Complete scoring breakdown and AI insights',
      }),
    );

    // Add credit_score_calculated_at column
    await queryRunner.addColumn(
      'loan_applications',
      new TableColumn({
        name: 'credit_score_calculated_at',
        type: 'timestamp',
        isNullable: true,
        comment: 'Timestamp when credit score was last calculated',
      }),
    );

    // Add index on credit_score for faster queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_loan_applications_credit_score" 
      ON "loan_applications" ("credit_score")
    `);

    // Add index on credit_score_calculated_at for filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_loan_applications_credit_score_calculated_at" 
      ON "loan_applications" ("credit_score_calculated_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_loan_applications_credit_score_calculated_at"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_loan_applications_credit_score"
    `);

    // Drop columns
    await queryRunner.dropColumn('loan_applications', 'credit_score_calculated_at');
    await queryRunner.dropColumn('loan_applications', 'scoring_details');
    await queryRunner.dropColumn('loan_applications', 'credit_score');
  }
}

