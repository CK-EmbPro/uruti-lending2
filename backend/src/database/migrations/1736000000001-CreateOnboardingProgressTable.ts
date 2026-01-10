import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOnboardingProgressTable1736000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'onboarding_progress',
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
            type: 'varchar',
            length: '255',
          },
          {
            name: 'currentStep',
            type: 'enum',
            enum: [
              'PROFILE',
              'ID_VERIFICATION',
              'BIOMETRIC',
              'DOCUMENTS',
              'REVIEW',
              'SIGNATURE',
              'COMPLETE',
            ],
            default: "'PROFILE'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED'],
            default: "'IN_PROGRESS'",
          },
          {
            name: 'completionPercentage',
            type: 'int',
            default: 0,
          },
          {
            name: 'formData',
            type: 'jsonb',
          },
          {
            name: 'platform',
            type: 'enum',
            enum: ['IOS', 'ANDROID', 'WEB'],
            isNullable: true,
          },
          {
            name: 'biometricData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'signatureData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isRemote',
            type: 'boolean',
            default: false,
          },
          {
            name: 'requiresBranchVisit',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'lastSavedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'onboarding_progress',
      new TableIndex({
        name: 'IDX_onboarding_progress_applicationId',
        columnNames: ['applicationId'],
      }),
    );

    await queryRunner.createIndex(
      'onboarding_progress',
      new TableIndex({
        name: 'IDX_onboarding_progress_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'onboarding_progress',
      new TableIndex({
        name: 'IDX_onboarding_progress_currentStep',
        columnNames: ['currentStep'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('onboarding_progress');
  }
}

