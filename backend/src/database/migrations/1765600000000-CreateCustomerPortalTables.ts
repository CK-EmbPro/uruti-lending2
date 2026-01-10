import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCustomerPortalTables1765600000000 implements MigrationInterface {
  name = 'CreateCustomerPortalTables1765600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Helper to check if a table exists
    const tableExists = async (tableName: string) => {
      const result = await queryRunner.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${tableName}')`,
      );
      return result[0].exists;
    };

    // Create customer_portal_users table
    if (!(await tableExists('customer_portal_users'))) {
      await queryRunner.createTable(
        new Table({
          name: 'customer_portal_users',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'email',
              type: 'varchar',
              isUnique: true,
              isNullable: false,
            },
            {
              name: 'password',
              type: 'varchar',
              isNullable: false,
            },
            {
              name: 'name',
              type: 'varchar',
              isNullable: false,
            },
            {
              name: 'phoneNumber',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'isActive',
              type: 'boolean',
              default: true,
            },
            {
              name: 'emailVerified',
              type: 'boolean',
              default: false,
            },
            {
              name: 'emailVerificationToken',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'emailVerifiedAt',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'lastLoginAt',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'lastLoginIp',
              type: 'varchar',
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
            },
          ],
        }),
        true,
      );

      // Create index on email
      await queryRunner.createIndex(
        'customer_portal_users',
        new TableIndex({
          name: 'IDX_customer_portal_users_email',
          columnNames: ['email'],
          isUnique: true,
        }),
      );
    }

    // Create customer_loan_links table
    if (!(await tableExists('customer_loan_links'))) {
      await queryRunner.createTable(
        new Table({
          name: 'customer_loan_links',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'customerId',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'loanId',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'isVerified',
              type: 'boolean',
              default: false,
            },
            {
              name: 'verificationMethod',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'verifiedAt',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'verifiedBy',
              type: 'varchar',
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
            },
          ],
        }),
        true,
      );

      // Create unique index on customerId and loanId combination
      await queryRunner.createIndex(
        'customer_loan_links',
        new TableIndex({
          name: 'IDX_customer_loan_links_customer_loan',
          columnNames: ['customerId', 'loanId'],
          isUnique: true,
        }),
      );

      // Create index on customerId
      await queryRunner.createIndex(
        'customer_loan_links',
        new TableIndex({
          name: 'IDX_customer_loan_links_customerId',
          columnNames: ['customerId'],
        }),
      );

      // Create index on loanId
      await queryRunner.createIndex(
        'customer_loan_links',
        new TableIndex({
          name: 'IDX_customer_loan_links_loanId',
          columnNames: ['loanId'],
        }),
      );

      // Create foreign key to customer_portal_users
      await queryRunner.createForeignKey(
        'customer_loan_links',
        new TableForeignKey({
          columnNames: ['customerId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'customer_portal_users',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      // Create foreign key to loans
      await queryRunner.createForeignKey(
        'customer_loan_links',
        new TableForeignKey({
          columnNames: ['loanId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'loans',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const customerLoanLinksTable = await queryRunner.getTable('customer_loan_links');
    if (customerLoanLinksTable) {
      const foreignKeys = customerLoanLinksTable.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('customer_loan_links', foreignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable('customer_loan_links', true);
    await queryRunner.dropTable('customer_portal_users', true);
  }
}

