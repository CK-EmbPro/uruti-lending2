import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAIDocumentProcessingTable1735000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ai_document_processings table
    await queryRunner.createTable(
      new Table({
        name: 'ai_document_processings',
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
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'applicationId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'documentType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'fileUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'filePath',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'mimeType',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Pending'",
          },
          {
            name: 'extractedData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'rawText',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'confidence',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'validationErrors',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'suggestions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'processingTime',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'aiModel',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'aiProvider',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'autoFilled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'filledFields',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'processedBy',
            type: 'varchar',
            length: '255',
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
      'ai_document_processings',
      new TableIndex({
        name: 'IDX_ai_document_processings_documentId',
        columnNames: ['documentId'],
      }),
    );

    await queryRunner.createIndex(
      'ai_document_processings',
      new TableIndex({
        name: 'IDX_ai_document_processings_applicationId',
        columnNames: ['applicationId'],
      }),
    );

    await queryRunner.createIndex(
      'ai_document_processings',
      new TableIndex({
        name: 'IDX_ai_document_processings_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'ai_document_processings',
      new TableIndex({
        name: 'IDX_ai_document_processings_createdAt',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ai_document_processings', true);
  }
}

