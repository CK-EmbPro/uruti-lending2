import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAdministrationTables1735000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions table
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'resource', type: 'varchar', length: '100', isNullable: false },
          { name: 'action', type: 'varchar', length: '100', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'permissions',
      new TableIndex({
        name: 'IDX_permissions_resource_action',
        columnNames: ['resource', 'action'],
        isUnique: true,
      }),
    );

    // Create roles table
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '100', isNullable: false, isUnique: true },
          { name: 'roleType', type: 'varchar', length: '50', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          { name: 'createdBy', type: 'varchar', length: '255', isNullable: true },
          { name: 'updatedBy', type: 'varchar', length: '255', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'roles',
      new TableIndex({
        name: 'IDX_roles_name',
        columnNames: ['name'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'roles',
      new TableIndex({
        name: 'IDX_roles_roleType',
        columnNames: ['roleType'],
      }),
    );

    // Create role_permissions junction table
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          { name: 'roleId', type: 'uuid', isPrimary: true },
          { name: 'permissionId', type: 'uuid', isPrimary: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['roleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['permissionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'permissions',
        onDelete: 'CASCADE',
      }),
    );

    // Create user_accounts table
    await queryRunner.createTable(
      new Table({
        name: 'user_accounts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'email', type: 'varchar', length: '255', isNullable: false, isUnique: true },
          { name: 'password', type: 'varchar', length: '255', isNullable: false },
          { name: 'name', type: 'varchar', length: '255', isNullable: false },
          { name: 'phoneNumber', type: 'varchar', length: '50', isNullable: true },
          { name: 'companyId', type: 'varchar', length: '255', isNullable: false },
          { name: 'status', type: 'varchar', length: '50', isNullable: false, default: "'Pending Activation'" },
          { name: 'isMfaEnabled', type: 'boolean', default: false },
          { name: 'mfaSecret', type: 'varchar', length: '255', isNullable: true },
          { name: 'lastLoginAt', type: 'timestamp', isNullable: true },
          { name: 'lastLoginIp', type: 'varchar', length: '50', isNullable: true },
          { name: 'failedLoginAttempts', type: 'int', default: 0 },
          { name: 'lockedUntil', type: 'timestamp', isNullable: true },
          { name: 'activatedAt', type: 'timestamp', isNullable: true },
          { name: 'activatedBy', type: 'varchar', length: '255', isNullable: true },
          { name: 'remarks', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          { name: 'createdBy', type: 'varchar', length: '255', isNullable: true },
          { name: 'updatedBy', type: 'varchar', length: '255', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'user_accounts',
      new TableIndex({
        name: 'IDX_user_accounts_email',
        columnNames: ['email'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'user_accounts',
      new TableIndex({
        name: 'IDX_user_accounts_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'user_accounts',
      new TableIndex({
        name: 'IDX_user_accounts_companyId',
        columnNames: ['companyId'],
      }),
    );

    // Create user_roles junction table
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          { name: 'userId', type: 'uuid', isPrimary: true },
          { name: 'roleId', type: 'uuid', isPrimary: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user_accounts',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['roleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'CASCADE',
      }),
    );

    // Create user_activity_logs table
    await queryRunner.createTable(
      new Table({
        name: 'user_activity_logs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'activityType', type: 'varchar', length: '100', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'ipAddress', type: 'varchar', length: '50', isNullable: true },
          { name: 'userAgent', type: 'varchar', length: '500', isNullable: true },
          { name: 'activityDate', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_activity_logs',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user_accounts',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'user_activity_logs',
      new TableIndex({
        name: 'IDX_user_activity_logs_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'user_activity_logs',
      new TableIndex({
        name: 'IDX_user_activity_logs_activityDate',
        columnNames: ['activityDate'],
      }),
    );

    await queryRunner.createIndex(
      'user_activity_logs',
      new TableIndex({
        name: 'IDX_user_activity_logs_activityType',
        columnNames: ['activityType'],
      }),
    );

    // Create product_configurations table
    await queryRunner.createTable(
      new Table({
        name: 'product_configurations',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'productCode', type: 'varchar', length: '100', isNullable: false, isUnique: true },
          { name: 'productName', type: 'varchar', length: '255', isNullable: false },
          { name: 'companyId', type: 'varchar', length: '255', isNullable: false },
          { name: 'status', type: 'varchar', length: '50', isNullable: false, default: "'Draft'" },
          { name: 'minimumLoanAmount', type: 'decimal', precision: 15, scale: 2, isNullable: true },
          { name: 'maximumLoanAmount', type: 'decimal', precision: 15, scale: 2, isNullable: true },
          { name: 'minimumCreditScore', type: 'int', isNullable: true },
          { name: 'minimumAge', type: 'int', isNullable: true },
          { name: 'maximumAge', type: 'int', isNullable: true },
          { name: 'maximumDebtToIncomeRatio', type: 'decimal', precision: 5, scale: 2, isNullable: true },
          { name: 'requiredDocuments', type: 'jsonb', isNullable: true },
          { name: 'employmentTypes', type: 'jsonb', isNullable: true },
          { name: 'baseInterestRate', type: 'decimal', precision: 5, scale: 2, isNullable: false },
          { name: 'minimumInterestRate', type: 'decimal', precision: 5, scale: 2, isNullable: true },
          { name: 'maximumInterestRate', type: 'decimal', precision: 5, scale: 2, isNullable: true },
          { name: 'interestRateFactors', type: 'jsonb', isNullable: true },
          { name: 'approvalWorkflow', type: 'jsonb', isNullable: true },
          { name: 'disbursementWorkflow', type: 'jsonb', isNullable: true },
          { name: 'minimumTerm', type: 'int', isNullable: true },
          { name: 'maximumTerm', type: 'int', isNullable: true },
          { name: 'allowsPrepayment', type: 'boolean', default: false },
          { name: 'allowsRefinancing', type: 'boolean', default: false },
          { name: 'requiresCollateral', type: 'boolean', default: false },
          { name: 'productDescription', type: 'text', isNullable: true },
          { name: 'termsAndConditions', type: 'text', isNullable: true },
          { name: 'testedAt', type: 'timestamp', isNullable: true },
          { name: 'testedBy', type: 'varchar', length: '255', isNullable: true },
          { name: 'activatedAt', type: 'timestamp', isNullable: true },
          { name: 'activatedBy', type: 'varchar', length: '255', isNullable: true },
          { name: 'testResults', type: 'text', isNullable: true },
          { name: 'remarks', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          { name: 'createdBy', type: 'varchar', length: '255', isNullable: true },
          { name: 'updatedBy', type: 'varchar', length: '255', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'product_configurations',
      new TableIndex({
        name: 'IDX_product_configurations_productCode',
        columnNames: ['productCode'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'product_configurations',
      new TableIndex({
        name: 'IDX_product_configurations_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'product_configurations',
      new TableIndex({
        name: 'IDX_product_configurations_companyId',
        columnNames: ['companyId'],
      }),
    );

    // Create business_rules table
    await queryRunner.createTable(
      new Table({
        name: 'business_rules',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'ruleName', type: 'varchar', length: '255', isNullable: false, isUnique: true },
          { name: 'ruleCategory', type: 'varchar', length: '100', isNullable: false },
          { name: 'ruleDescription', type: 'text', isNullable: false },
          { name: 'status', type: 'varchar', length: '50', isNullable: false, default: "'Draft'" },
          { name: 'ruleDefinition', type: 'jsonb', isNullable: false },
          { name: 'testData', type: 'jsonb', isNullable: true },
          { name: 'testResults', type: 'jsonb', isNullable: true },
          { name: 'testedInSandbox', type: 'boolean', default: false },
          { name: 'testedAt', type: 'timestamp', isNullable: true },
          { name: 'testedBy', type: 'varchar', length: '255', isNullable: true },
          { name: 'sandboxTestResults', type: 'text', isNullable: true },
          { name: 'impactAnalysis', type: 'jsonb', isNullable: true },
          { name: 'estimatedAffectedLoans', type: 'int', isNullable: true },
          { name: 'impactNotes', type: 'text', isNullable: true },
          { name: 'promotedToProductionAt', type: 'timestamp', isNullable: true },
          { name: 'promotedBy', type: 'varchar', length: '255', isNullable: true },
          { name: 'promotionNotes', type: 'text', isNullable: true },
          { name: 'monitoringMetrics', type: 'jsonb', isNullable: true },
          { name: 'actualResults', type: 'jsonb', isNullable: true },
          { name: 'remarks', type: 'text', isNullable: true },
          { name: 'version', type: 'varchar', length: '50', isNullable: true },
          { name: 'previousVersionId', type: 'varchar', length: '255', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          { name: 'createdBy', type: 'varchar', length: '255', isNullable: true },
          { name: 'updatedBy', type: 'varchar', length: '255', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'business_rules',
      new TableIndex({
        name: 'IDX_business_rules_ruleName',
        columnNames: ['ruleName'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'business_rules',
      new TableIndex({
        name: 'IDX_business_rules_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'business_rules',
      new TableIndex({
        name: 'IDX_business_rules_ruleCategory',
        columnNames: ['ruleCategory'],
      }),
    );

    // Create fee_schedules table
    await queryRunner.createTable(
      new Table({
        name: 'fee_schedules',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'feeCode', type: 'varchar', length: '100', isNullable: false, isUnique: true },
          { name: 'feeName', type: 'varchar', length: '255', isNullable: false },
          { name: 'feeType', type: 'varchar', length: '50', isNullable: false },
          { name: 'companyId', type: 'varchar', length: '255', isNullable: false },
          { name: 'fixedAmount', type: 'decimal', precision: 15, scale: 2, isNullable: true },
          { name: 'percentageAmount', type: 'decimal', precision: 5, scale: 2, isNullable: true },
          { name: 'minimumAmount', type: 'decimal', precision: 15, scale: 2, isNullable: true },
          { name: 'maximumAmount', type: 'decimal', precision: 15, scale: 2, isNullable: true },
          { name: 'effectiveDate', type: 'date', isNullable: false },
          { name: 'expiryDate', type: 'date', isNullable: true },
          { name: 'grandfatherExistingAccounts', type: 'boolean', default: false },
          { name: 'grandfatherCutoffDate', type: 'date', isNullable: true },
          { name: 'isPromotional', type: 'boolean', default: false },
          { name: 'promotionalStartDate', type: 'date', isNullable: true },
          { name: 'promotionalEndDate', type: 'date', isNullable: true },
          { name: 'promotionalTerms', type: 'text', isNullable: true },
          { name: 'applicableLoanProducts', type: 'jsonb', isNullable: true },
          { name: 'applicableLoanTypes', type: 'jsonb', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'notificationSent', type: 'boolean', default: false },
          { name: 'notificationSentAt', type: 'timestamp', isNullable: true },
          { name: 'affectedCustomersCount', type: 'int', isNullable: true },
          { name: 'notificationMessage', type: 'text', isNullable: true },
          { name: 'remarks', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          { name: 'createdBy', type: 'varchar', length: '255', isNullable: true },
          { name: 'updatedBy', type: 'varchar', length: '255', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'fee_schedules',
      new TableIndex({
        name: 'IDX_fee_schedules_feeCode',
        columnNames: ['feeCode'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'fee_schedules',
      new TableIndex({
        name: 'IDX_fee_schedules_feeType',
        columnNames: ['feeType'],
      }),
    );

    await queryRunner.createIndex(
      'fee_schedules',
      new TableIndex({
        name: 'IDX_fee_schedules_effectiveDate',
        columnNames: ['effectiveDate'],
      }),
    );

    await queryRunner.createIndex(
      'fee_schedules',
      new TableIndex({
        name: 'IDX_fee_schedules_companyId',
        columnNames: ['companyId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('fee_schedules', true);
    await queryRunner.dropTable('business_rules', true);
    await queryRunner.dropTable('product_configurations', true);
    await queryRunner.dropTable('user_activity_logs', true);
    await queryRunner.dropTable('user_roles', true);
    await queryRunner.dropTable('user_accounts', true);
    await queryRunner.dropTable('role_permissions', true);
    await queryRunner.dropTable('roles', true);
    await queryRunner.dropTable('permissions', true);
  }
}

