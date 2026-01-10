import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRepaymentStructureToLoan1766100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'loans',
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
    await queryRunner.dropColumn('loans', 'repaymentStructure');
  }
}

