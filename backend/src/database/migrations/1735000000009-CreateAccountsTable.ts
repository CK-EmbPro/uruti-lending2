import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAccountsTable1735000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'accountCode',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'accountName',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'accountType',
            type: 'enum',
            enum: ['Asset', 'Liability', 'Income', 'Expense', 'Equity'],
            isNullable: false,
          },
          {
            name: 'rootType',
            type: 'enum',
            enum: ['Asset', 'Liability', 'Income', 'Expense', 'Equity'],
            isNullable: false,
          },
          {
            name: 'isGroup',
            type: 'boolean',
            default: false,
          },
          {
            name: 'parentAccountId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'companyId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'openingBalance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isFrozen',
            type: 'boolean',
            default: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'accountNumber',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'bankName',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'USD'",
          },
          {
            name: 'level',
            type: 'int',
            default: 0,
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

    // Create indexes
    await queryRunner.createIndex(
      'accounts',
      new TableIndex({
        name: 'IDX_accounts_accountCode_companyId',
        columnNames: ['accountCode', 'companyId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'accounts',
      new TableIndex({
        name: 'IDX_accounts_companyId',
        columnNames: ['companyId'],
      }),
    );

    await queryRunner.createIndex(
      'accounts',
      new TableIndex({
        name: 'IDX_accounts_parentAccountId',
        columnNames: ['parentAccountId'],
      }),
    );

    await queryRunner.createIndex(
      'accounts',
      new TableIndex({
        name: 'IDX_accounts_rootType',
        columnNames: ['rootType'],
      }),
    );

    await queryRunner.createIndex(
      'accounts',
      new TableIndex({
        name: 'IDX_accounts_accountType',
        columnNames: ['accountType'],
      }),
    );

    await queryRunner.createIndex(
      'accounts',
      new TableIndex({
        name: 'IDX_accounts_isGroup',
        columnNames: ['isGroup'],
      }),
    );

    // Create foreign key (check if it exists first)
    const table = await queryRunner.getTable('accounts');
    const foreignKeyExists = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('parentAccountId') !== -1,
    );

    if (!foreignKeyExists) {
      await queryRunner.createForeignKey(
        'accounts',
        new TableForeignKey({
          columnNames: ['parentAccountId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'accounts',
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('accounts');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('parentAccountId') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('accounts', foreignKey);
      }
    }

    await queryRunner.dropTable('accounts');
  }
}

