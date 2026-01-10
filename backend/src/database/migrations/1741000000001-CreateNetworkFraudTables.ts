import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateNetworkFraudTables1741000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create network_relationships table
    await queryRunner.createTable(
      new Table({
        name: 'network_relationships',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sourceApplicationId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'targetApplicationId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'relationshipType',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'sharedAttribute',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'similarityScore',
            type: 'int',
            default: 100,
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

    // Create indexes for network_relationships
    await queryRunner.createIndex(
      'network_relationships',
      new TableIndex({
        name: 'IDX_network_relationships_sourceApplicationId',
        columnNames: ['sourceApplicationId'],
      }),
    );
    await queryRunner.createIndex(
      'network_relationships',
      new TableIndex({
        name: 'IDX_network_relationships_targetApplicationId',
        columnNames: ['targetApplicationId'],
      }),
    );
    await queryRunner.createIndex(
      'network_relationships',
      new TableIndex({
        name: 'IDX_network_relationships_relationshipType',
        columnNames: ['relationshipType'],
      }),
    );
    await queryRunner.createIndex(
      'network_relationships',
      new TableIndex({
        name: 'IDX_network_relationships_sharedAttribute',
        columnNames: ['sharedAttribute'],
      }),
    );
    await queryRunner.createIndex(
      'network_relationships',
      new TableIndex({
        name: 'IDX_network_relationships_source_target',
        columnNames: ['sourceApplicationId', 'targetApplicationId'],
      }),
    );

    // Create network_clusters table
    await queryRunner.createTable(
      new Table({
        name: 'network_clusters',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'applicationIds',
            type: 'text',
            isArray: true,
            isNullable: false,
          },
          {
            name: 'size',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'density',
            type: 'decimal',
            precision: 5,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'relationshipTypes',
            type: 'text',
            isArray: true,
            isNullable: false,
          },
          {
            name: 'flagged',
            type: 'boolean',
            default: false,
          },
          {
            name: 'fraudulentMembers',
            type: 'int',
            default: 0,
          },
          {
            name: 'defaultedMembers',
            type: 'int',
            default: 0,
          },
          {
            name: 'riskScore',
            type: 'int',
            default: 0,
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

    // Create indexes for network_clusters
    await queryRunner.createIndex(
      'network_clusters',
      new TableIndex({
        name: 'IDX_network_clusters_flagged',
        columnNames: ['flagged'],
      }),
    );
    await queryRunner.createIndex(
      'network_clusters',
      new TableIndex({
        name: 'IDX_network_clusters_riskScore',
        columnNames: ['riskScore'],
      }),
    );

    // Create fraud_investigation_cases table
    await queryRunner.createTable(
      new Table({
        name: 'fraud_investigation_cases',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'caseNumber',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'applicationIds',
            type: 'text',
            isArray: true,
            isNullable: false,
          },
          {
            name: 'clusterId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'OPEN'",
            isNullable: false,
          },
          {
            name: 'escalationLevel',
            type: 'varchar',
            default: "'NONE'",
            isNullable: false,
          },
          {
            name: 'assignedTo',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'totalAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'evidence',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'findings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'slaDeadline',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'investigationStartedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'investigationCompletedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lawEnforcementNotified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'lawEnforcementNotifiedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'resolutionNotes',
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
          },
        ],
      }),
      true,
    );

    // Create indexes for fraud_investigation_cases
    await queryRunner.createIndex(
      'fraud_investigation_cases',
      new TableIndex({
        name: 'IDX_fraud_investigation_cases_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'fraud_investigation_cases',
      new TableIndex({
        name: 'IDX_fraud_investigation_cases_escalationLevel',
        columnNames: ['escalationLevel'],
      }),
    );
    await queryRunner.createIndex(
      'fraud_investigation_cases',
      new TableIndex({
        name: 'IDX_fraud_investigation_cases_assignedTo',
        columnNames: ['assignedTo'],
      }),
    );
    await queryRunner.createIndex(
      'fraud_investigation_cases',
      new TableIndex({
        name: 'IDX_fraud_investigation_cases_createdAt',
        columnNames: ['createdAt'],
      }),
    );
    await queryRunner.createIndex(
      'fraud_investigation_cases',
      new TableIndex({
        name: 'IDX_fraud_investigation_cases_slaDeadline',
        columnNames: ['slaDeadline'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('fraud_investigation_cases');
    await queryRunner.dropTable('network_clusters');
    await queryRunner.dropTable('network_relationships');
  }
}

