import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRepaymentStructureToLoanApplication1766000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'loan_applications',
      new TableColumn({
        name: 'repaymentStructure',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Repayment structure selected by borrower: FIXED, GRADUATED, SEASONAL, BULLET',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('loan_applications', 'repaymentStructure');
  }
}

