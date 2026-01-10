import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAnalyticsTables1765500000000 implements MigrationInterface {
  name = 'CreateAnalyticsTables1765500000000';

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

    // Create ENUM types if they don't exist
    if (!(await typeExists('widget_type_enum'))) {
      await queryRunner.query(
        `CREATE TYPE "public"."widget_type_enum" AS ENUM('Metric', 'Chart', 'Table', 'KPI', 'Alert')`,
      );
    }

    if (!(await typeExists('chart_type_enum'))) {
      await queryRunner.query(
        `CREATE TYPE "public"."chart_type_enum" AS ENUM('Line', 'Bar', 'Pie', 'Area', 'Donut')`,
      );
    }

    if (!(await typeExists('metric_type_enum'))) {
      await queryRunner.query(
        `CREATE TYPE "public"."metric_type_enum" AS ENUM('Portfolio Health', 'Delinquency', 'Operational', 'Financial', 'Customer')`,
      );
    }

    // Create dashboards table
    if (!(await tableExists('dashboards'))) {
      await queryRunner.createTable(
        new Table({
          name: 'dashboards',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            { name: 'userId', type: 'varchar', isNullable: false },
            { name: 'companyId', type: 'varchar', isNullable: true },
            { name: 'name', type: 'varchar', isNullable: false },
            { name: 'description', type: 'text', isNullable: true },
            { name: 'isDefault', type: 'boolean', default: false },
            { name: 'isPublic', type: 'boolean', default: false },
            { name: 'layout', type: 'jsonb', isNullable: true },
            { name: 'filters', type: 'jsonb', isNullable: true },
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

      // Create indexes
      await queryRunner.createIndex(
        'dashboards',
        new TableIndex({
          name: 'IDX_dashboards_userId',
          columnNames: ['userId'],
        }),
      );

      await queryRunner.createIndex(
        'dashboards',
        new TableIndex({
          name: 'IDX_dashboards_companyId',
          columnNames: ['companyId'],
        }),
      );
    }

    // Create dashboard_widgets table
    if (!(await tableExists('dashboard_widgets'))) {
      await queryRunner.createTable(
        new Table({
          name: 'dashboard_widgets',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            { name: 'dashboardId', type: 'uuid', isNullable: false },
            {
              name: 'widgetType',
              type: 'enum',
              enum: ['Metric', 'Chart', 'Table', 'KPI', 'Alert'],
              isNullable: false,
            },
            {
              name: 'metricType',
              type: 'enum',
              enum: ['Portfolio Health', 'Delinquency', 'Operational', 'Financial', 'Customer'],
              isNullable: true,
            },
            {
              name: 'chartType',
              type: 'enum',
              enum: ['Line', 'Bar', 'Pie', 'Area', 'Donut'],
              isNullable: true,
            },
            { name: 'title', type: 'varchar', isNullable: false },
            { name: 'description', type: 'text', isNullable: true },
            { name: 'metricId', type: 'varchar', isNullable: false },
            { name: 'config', type: 'jsonb', isNullable: true },
            { name: 'positionX', type: 'int', isNullable: false },
            { name: 'positionY', type: 'int', isNullable: false },
            { name: 'width', type: 'int', isNullable: false },
            { name: 'height', type: 'int', isNullable: false },
            { name: 'isVisible', type: 'boolean', default: true },
            { name: 'refreshInterval', type: 'int', default: 0 },
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

      // Create foreign key
      await queryRunner.createForeignKey(
        'dashboard_widgets',
        new TableForeignKey({
          columnNames: ['dashboardId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'dashboards',
          onDelete: 'CASCADE',
        }),
      );

      // Create index
      await queryRunner.createIndex(
        'dashboard_widgets',
        new TableIndex({
          name: 'IDX_dashboard_widgets_dashboardId',
          columnNames: ['dashboardId'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.dropTable('dashboard_widgets', true);
    await queryRunner.dropTable('dashboards', true);

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."metric_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."chart_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."widget_type_enum"`);
  }
}

