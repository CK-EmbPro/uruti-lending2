import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSearchTables1765400000000 implements MigrationInterface {
  name = 'CreateSearchTables1765400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Helper to check if a type exists
    const typeExists = async (typeName: string) => {
      const result = await queryRunner.query(
        `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}')`,
      );
      return result[0].exists;
    };

    // Helper to check if a table exists
    const tableExists = async (tableName: string) => {
      const result = await queryRunner.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${tableName}')`,
      );
      return result[0].exists;
    };

    // Create ENUM type if it doesn't exist
    if (!(await typeExists('search_entity_type_enum'))) {
      await queryRunner.query(
        `CREATE TYPE "public"."search_entity_type_enum" AS ENUM('Loan', 'LoanApplication', 'Customer', 'LoanProduct', 'LoanRepayment', 'LoanDisbursement', 'All')`,
      );
    }

    // Create saved_searches table
    if (!(await tableExists('saved_searches'))) {
      await queryRunner.createTable(
        new Table({
          name: 'saved_searches',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            { name: 'userId', type: 'varchar', isNullable: false },
            { name: 'name', type: 'varchar', isNullable: false },
            { name: 'description', type: 'text', isNullable: true },
            {
              name: 'entityType',
              type: 'enum',
              enum: ['Loan', 'LoanApplication', 'Customer', 'LoanProduct', 'LoanRepayment', 'LoanDisbursement', 'All'],
              isNullable: true,
            },
            { name: 'query', type: 'text', isNullable: true },
            { name: 'filters', type: 'jsonb', isNullable: true },
            { name: 'sortBy', type: 'jsonb', isNullable: true },
            { name: 'limit', type: 'int', default: 20 },
            { name: 'isDefault', type: 'boolean', default: false },
            { name: 'useCount', type: 'int', default: 0 },
            { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'lastUsedAt', type: 'timestamp', isNullable: true },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'saved_searches',
        new TableIndex({
          name: 'IDX_saved_searches_userId',
          columnNames: ['userId'],
        }),
      );

      await queryRunner.createIndex(
        'saved_searches',
        new TableIndex({
          name: 'IDX_saved_searches_entityType',
          columnNames: ['entityType'],
        }),
      );
    }

    // Create search_history table
    if (!(await tableExists('search_history'))) {
      await queryRunner.createTable(
        new Table({
          name: 'search_history',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            { name: 'userId', type: 'varchar', isNullable: false },
            {
              name: 'entityType',
              type: 'enum',
              enum: ['Loan', 'LoanApplication', 'Customer', 'LoanProduct', 'LoanRepayment', 'LoanDisbursement', 'All'],
              isNullable: true,
            },
            { name: 'query', type: 'text', isNullable: true },
            { name: 'filters', type: 'jsonb', isNullable: true },
            { name: 'resultCount', type: 'int', default: 0 },
            { name: 'clickedResult', type: 'boolean', default: false },
            { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'search_history',
        new TableIndex({
          name: 'IDX_search_history_userId',
          columnNames: ['userId'],
        }),
      );

      await queryRunner.createIndex(
        'search_history',
        new TableIndex({
          name: 'IDX_search_history_createdAt',
          columnNames: ['createdAt'],
        }),
      );

      await queryRunner.createIndex(
        'search_history',
        new TableIndex({
          name: 'IDX_search_history_entityType',
          columnNames: ['entityType'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('search_history', true);
    await queryRunner.dropTable('saved_searches', true);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."search_entity_type_enum"`);
  }
}

