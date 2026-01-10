import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhanceCustomerLoanLinks1765700000000 implements MigrationInterface {
  name = 'EnhanceCustomerLoanLinks1765700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer_loan_links');
    
    if (table) {
      // Check if columns exist before adding
      const hasRejectionReason = table.findColumnByName('rejectionReason');
      const hasRejectedAt = table.findColumnByName('rejectedAt');
      const hasRejectedBy = table.findColumnByName('rejectedBy');
      const hasAdminNotes = table.findColumnByName('adminNotes');
      const hasVerificationData = table.findColumnByName('verificationData');

      if (!hasRejectionReason) {
        await queryRunner.addColumn('customer_loan_links', new TableColumn({
          name: 'rejectionReason',
          type: 'varchar',
          isNullable: true,
        }));
      }

      if (!hasRejectedAt) {
        await queryRunner.addColumn('customer_loan_links', new TableColumn({
          name: 'rejectedAt',
          type: 'timestamp',
          isNullable: true,
        }));
      }

      if (!hasRejectedBy) {
        await queryRunner.addColumn('customer_loan_links', new TableColumn({
          name: 'rejectedBy',
          type: 'varchar',
          isNullable: true,
        }));
      }

      if (!hasAdminNotes) {
        await queryRunner.addColumn('customer_loan_links', new TableColumn({
          name: 'adminNotes',
          type: 'text',
          isNullable: true,
        }));
      }

      if (!hasVerificationData) {
        await queryRunner.addColumn('customer_loan_links', new TableColumn({
          name: 'verificationData',
          type: 'json',
          isNullable: true,
        }));
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer_loan_links');
    
    if (table) {
      const columnsToDrop = ['rejectionReason', 'rejectedAt', 'rejectedBy', 'adminNotes', 'verificationData'];
      
      for (const columnName of columnsToDrop) {
        const column = table.findColumnByName(columnName);
        if (column) {
          await queryRunner.dropColumn('customer_loan_links', columnName);
        }
      }
    }
  }
}

