import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddCompanyIdToUsers1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    
    // Add companyId column to users table (if it doesn't exist)
    const hasCompanyId = table?.findColumnByName('companyId');
    if (!hasCompanyId) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'companyId',
          type: 'uuid',
          isNullable: true, // Nullable for backward compatibility
        }),
      );
    }

    // Create index for performance (if it doesn't exist)
    const hasIndex = table?.indices.find(idx => idx.name === 'IDX_users_companyId');
    if (!hasIndex) {
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'IDX_users_companyId',
          columnNames: ['companyId'],
        }),
      );
    }

    // Add foreign key constraint (if it doesn't exist)
    const hasForeignKey = table?.foreignKeys.find(fk => fk.name === 'FK_users_company');
    if (!hasForeignKey) {
      await queryRunner.createForeignKey(
        'users',
        new TableForeignKey({
          columnNames: ['companyId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'companies',
          onDelete: 'RESTRICT', // Prevent deletion of company if users exist
          name: 'FK_users_company',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key
    await queryRunner.dropForeignKey('users', 'FK_users_company');

    // Remove index
    await queryRunner.dropIndex('users', 'IDX_users_companyId');

    // Remove column
    await queryRunner.dropColumn('users', 'companyId');
  }
}

