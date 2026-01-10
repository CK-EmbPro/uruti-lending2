import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateComplianceTables1735000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create kyc_screenings table
    await queryRunner.createTable(
      new Table({
        name: 'kyc_screenings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'applicationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'screeningType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'OFAC'",
          },
          {
            name: 'screeningDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'PENDING'",
          },
          {
            name: 'matchFound',
            type: 'boolean',
            default: false,
          },
          {
            name: 'matchCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'matchSeverity',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'matches',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'screeningData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'investigatedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'investigatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'investigationNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'requiresSAR',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sarFiled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sarFiledBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'sarFiledAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'sarReference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sarNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'resolvedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'resolvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'resolutionNotes',
            type: 'text',
            isNullable: true,
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

    await queryRunner.createForeignKey(
      'kyc_screenings',
      new TableForeignKey({
        columnNames: ['applicationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loan_applications',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'kyc_screenings',
      new TableIndex({
        name: 'IDX_kyc_screenings_applicationId',
        columnNames: ['applicationId'],
      }),
    );

    await queryRunner.createIndex(
      'kyc_screenings',
      new TableIndex({
        name: 'IDX_kyc_screenings_screeningDate',
        columnNames: ['screeningDate'],
      }),
    );

    await queryRunner.createIndex(
      'kyc_screenings',
      new TableIndex({
        name: 'IDX_kyc_screenings_status',
        columnNames: ['status'],
      }),
    );

    // Create privacy_consents table
    await queryRunner.createTable(
      new Table({
        name: 'privacy_consents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'applicationId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'customerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'consentType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'consentDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'PENDING'",
          },
          {
            name: 'consentText',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'explicitConsent',
            type: 'boolean',
            default: false,
          },
          {
            name: 'withdrawnAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'withdrawalReason',
            type: 'text',
            isNullable: true,
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

    await queryRunner.createIndex(
      'privacy_consents',
      new TableIndex({
        name: 'IDX_privacy_consents_applicationId',
        columnNames: ['applicationId'],
      }),
    );

    await queryRunner.createIndex(
      'privacy_consents',
      new TableIndex({
        name: 'IDX_privacy_consents_consentDate',
        columnNames: ['consentDate'],
      }),
    );

    await queryRunner.createIndex(
      'privacy_consents',
      new TableIndex({
        name: 'IDX_privacy_consents_status',
        columnNames: ['status'],
      }),
    );

    // Create privacy_requests table
    await queryRunner.createTable(
      new Table({
        name: 'privacy_requests',
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
            name: 'requestType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'requestDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'PENDING'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'requestDetails',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'processedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'processedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'processingNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'responseData',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'rejectionReason',
            type: 'text',
            isNullable: true,
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

    await queryRunner.createIndex(
      'privacy_requests',
      new TableIndex({
        name: 'IDX_privacy_requests_customerId',
        columnNames: ['customerId'],
      }),
    );

    await queryRunner.createIndex(
      'privacy_requests',
      new TableIndex({
        name: 'IDX_privacy_requests_requestDate',
        columnNames: ['requestDate'],
      }),
    );

    await queryRunner.createIndex(
      'privacy_requests',
      new TableIndex({
        name: 'IDX_privacy_requests_status',
        columnNames: ['status'],
      }),
    );

    // Create audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'userName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'userEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'eventType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'entityType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'entityId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'entityName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'oldValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'newValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'requestId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sessionId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'region',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_entityType',
        columnNames: ['entityType'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_entityId',
        columnNames: ['entityId'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_eventType',
        columnNames: ['eventType'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_timestamp',
        columnNames: ['timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_ipAddress',
        columnNames: ['ipAddress'],
      }),
    );

    // Create document_retentions table
    await queryRunner.createTable(
      new Table({
        name: 'document_retentions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'documentId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'documentType',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'documentPath',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'retentionCategory',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'documentDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'retentionPeriodYears',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'retentionExpiryDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'ACTIVE'",
          },
          {
            name: 'archived',
            type: 'boolean',
            default: false,
          },
          {
            name: 'archivedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'archivedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'archiveLocation',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'onLegalHold',
            type: 'boolean',
            default: false,
          },
          {
            name: 'holdType',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'holdReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'holdPlacedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'holdPlacedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'holdExpiryDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'holdReleasedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'holdReleasedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'purged',
            type: 'boolean',
            default: false,
          },
          {
            name: 'purgedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'purgedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'purgeConfirmation',
            type: 'text',
            isNullable: true,
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

    await queryRunner.createIndex(
      'document_retentions',
      new TableIndex({
        name: 'IDX_document_retentions_documentId',
        columnNames: ['documentId'],
      }),
    );

    await queryRunner.createIndex(
      'document_retentions',
      new TableIndex({
        name: 'IDX_document_retentions_retentionExpiryDate',
        columnNames: ['retentionExpiryDate'],
      }),
    );

    await queryRunner.createIndex(
      'document_retentions',
      new TableIndex({
        name: 'IDX_document_retentions_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('document_retentions', true);
    await queryRunner.dropTable('audit_logs', true);
    await queryRunner.dropTable('privacy_requests', true);
    await queryRunner.dropTable('privacy_consents', true);
    await queryRunner.dropTable('kyc_screenings', true);
  }
}

