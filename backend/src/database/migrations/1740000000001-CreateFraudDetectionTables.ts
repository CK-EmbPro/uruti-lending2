import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateFraudDetectionTables1740000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create identity_duplication_checks table
    await queryRunner.createTable(
      new Table({
        name: 'identity_duplication_checks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'applicationId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'idNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'deviceFingerprint',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'biometricHash',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'bankAccountNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'fullName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'duplicates',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'suspiciousPatterns',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'riskScore',
            type: 'int',
            default: 0,
          },
          {
            name: 'flaggedForReview',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for identity_duplication_checks
    await queryRunner.createIndex(
      'identity_duplication_checks',
      new TableIndex({
        name: 'IDX_identity_duplication_checks_applicationId',
        columnNames: ['applicationId'],
      }),
    );
    await queryRunner.createIndex(
      'identity_duplication_checks',
      new TableIndex({
        name: 'IDX_identity_duplication_checks_idNumber',
        columnNames: ['idNumber'],
      }),
    );
    await queryRunner.createIndex(
      'identity_duplication_checks',
      new TableIndex({
        name: 'IDX_identity_duplication_checks_phoneNumber',
        columnNames: ['phoneNumber'],
      }),
    );
    await queryRunner.createIndex(
      'identity_duplication_checks',
      new TableIndex({
        name: 'IDX_identity_duplication_checks_email',
        columnNames: ['email'],
      }),
    );
    await queryRunner.createIndex(
      'identity_duplication_checks',
      new TableIndex({
        name: 'IDX_identity_duplication_checks_deviceFingerprint',
        columnNames: ['deviceFingerprint'],
      }),
    );
    await queryRunner.createIndex(
      'identity_duplication_checks',
      new TableIndex({
        name: 'IDX_identity_duplication_checks_biometricHash',
        columnNames: ['biometricHash'],
      }),
    );
    await queryRunner.createIndex(
      'identity_duplication_checks',
      new TableIndex({
        name: 'IDX_identity_duplication_checks_bankAccountNumber',
        columnNames: ['bankAccountNumber'],
      }),
    );

    // Create document_forgery_checks table
    await queryRunner.createTable(
      new Table({
        name: 'document_forgery_checks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'applicationId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'documentId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'fontAnalysis',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadataAnalysis',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'imageForensics',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'templateMatch',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'overallRiskScore',
            type: 'int',
            default: 0,
          },
          {
            name: 'requiresHumanReview',
            type: 'boolean',
            default: false,
          },
          {
            name: 'reviewReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reviewStatus',
            type: 'varchar',
            default: "'PENDING'",
          },
          {
            name: 'reviewedBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'reviewedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'isConfirmedFraud',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for document_forgery_checks
    await queryRunner.createIndex(
      'document_forgery_checks',
      new TableIndex({
        name: 'IDX_document_forgery_checks_applicationId',
        columnNames: ['applicationId'],
      }),
    );
    await queryRunner.createIndex(
      'document_forgery_checks',
      new TableIndex({
        name: 'IDX_document_forgery_checks_documentId',
        columnNames: ['documentId'],
      }),
    );
    await queryRunner.createIndex(
      'document_forgery_checks',
      new TableIndex({
        name: 'IDX_document_forgery_checks_requiresHumanReview',
        columnNames: ['requiresHumanReview'],
      }),
    );
    await queryRunner.createIndex(
      'document_forgery_checks',
      new TableIndex({
        name: 'IDX_document_forgery_checks_reviewStatus',
        columnNames: ['reviewStatus'],
      }),
    );

    // Create behavioral_anomaly_checks table
    await queryRunner.createTable(
      new Table({
        name: 'behavioral_anomaly_checks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'applicationId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'speedAnomaly',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'locationAnomaly',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'usagePatternAnomaly',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'multiPlatformAnomaly',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'overallAnomalyScore',
            type: 'int',
            default: 0,
          },
          {
            name: 'flaggedForReview',
            type: 'boolean',
            default: false,
          },
          {
            name: 'reviewThreshold',
            type: 'int',
            default: 70,
          },
          {
            name: 'deviceFingerprint',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'platform',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for behavioral_anomaly_checks
    await queryRunner.createIndex(
      'behavioral_anomaly_checks',
      new TableIndex({
        name: 'IDX_behavioral_anomaly_checks_applicationId',
        columnNames: ['applicationId'],
      }),
    );
    await queryRunner.createIndex(
      'behavioral_anomaly_checks',
      new TableIndex({
        name: 'IDX_behavioral_anomaly_checks_deviceFingerprint',
        columnNames: ['deviceFingerprint'],
      }),
    );
    await queryRunner.createIndex(
      'behavioral_anomaly_checks',
      new TableIndex({
        name: 'IDX_behavioral_anomaly_checks_flaggedForReview',
        columnNames: ['flaggedForReview'],
      }),
    );

    // Create forgery_templates table
    await queryRunner.createTable(
      new Table({
        name: 'forgery_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'templateName',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'templateDescription',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'templateImageHash',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'templateFeatures',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'matchCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'lastMatchedAt',
            type: 'timestamp',
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

    // Create indexes for forgery_templates
    await queryRunner.createIndex(
      'forgery_templates',
      new TableIndex({
        name: 'IDX_forgery_templates_templateName',
        columnNames: ['templateName'],
      }),
    );
    await queryRunner.createIndex(
      'forgery_templates',
      new TableIndex({
        name: 'IDX_forgery_templates_isActive',
        columnNames: ['isActive'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('forgery_templates');
    await queryRunner.dropTable('behavioral_anomaly_checks');
    await queryRunner.dropTable('document_forgery_checks');
    await queryRunner.dropTable('identity_duplication_checks');
  }
}

