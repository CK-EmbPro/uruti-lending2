import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateNotificationTables1765300000000 implements MigrationInterface {
  name = 'CreateNotificationTables1765300000000';

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
    if (!(await typeExists('notification_channel_enum'))) {
      await queryRunner.query(
        `CREATE TYPE "public"."notification_channel_enum" AS ENUM('Email', 'SMS', 'Push', 'In-App', 'WhatsApp', 'Letter')`,
      );
    }

    if (!(await typeExists('notification_status_enum'))) {
      await queryRunner.query(
        `CREATE TYPE "public"."notification_status_enum" AS ENUM('Pending', 'Sent', 'Delivered', 'Failed', 'Bounced', 'Opened', 'Clicked', 'Read')`,
      );
    }

    if (!(await typeExists('notification_type_enum'))) {
      await queryRunner.query(
        `CREATE TYPE "public"."notification_type_enum" AS ENUM(
          'Application Submitted', 'Application Approved', 'Application Rejected', 'Application Under Review',
          'Loan Disbursed', 'Loan Active', 'Loan Closed', 'Loan Overdue',
          'Payment Due', 'Payment Reminder', 'Payment Received', 'Payment Failed', 'Payment Scheduled',
          'Delinquency Notice', 'Collection Notice', 'Final Notice',
          'Profile Updated', 'Password Changed', 'Document Uploaded',
          'Promotional', 'New Product', 'Referral Bonus',
          'System Alert', 'Security Alert', 'Maintenance Notice'
        )`,
      );
    }

    // Create notification_templates table
    if (!(await tableExists('notification_templates'))) {
      await queryRunner.createTable(
        new Table({
          name: 'notification_templates',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            { name: 'name', type: 'varchar', isNullable: false },
            { name: 'description', type: 'text', isNullable: true },
            {
              name: 'notificationType',
              type: 'enum',
              enum: [
                'Application Submitted',
                'Application Approved',
                'Application Rejected',
                'Application Under Review',
                'Loan Disbursed',
                'Loan Active',
                'Loan Closed',
                'Loan Overdue',
                'Payment Due',
                'Payment Reminder',
                'Payment Received',
                'Payment Failed',
                'Payment Scheduled',
                'Delinquency Notice',
                'Collection Notice',
                'Final Notice',
                'Profile Updated',
                'Password Changed',
                'Document Uploaded',
                'Promotional',
                'New Product',
                'Referral Bonus',
                'System Alert',
                'Security Alert',
                'Maintenance Notice',
              ],
            },
            {
              name: 'channel',
              type: 'enum',
              enum: ['Email', 'SMS', 'Push', 'In-App', 'WhatsApp', 'Letter'],
            },
            { name: 'subject', type: 'varchar', isNullable: false },
            { name: 'body', type: 'text', isNullable: false },
            { name: 'variables', type: 'jsonb', isNullable: true },
            { name: 'isActive', type: 'boolean', default: true },
            { name: 'isDefault', type: 'boolean', default: false },
            { name: 'language', type: 'varchar', isNullable: true },
            { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'createdBy', type: 'varchar', isNullable: true },
            { name: 'updatedBy', type: 'varchar', isNullable: true },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'notification_templates',
        new TableIndex({
          name: 'IDX_notification_templates_type_channel',
          columnNames: ['notificationType', 'channel'],
        }),
      );

      await queryRunner.createIndex(
        'notification_templates',
        new TableIndex({
          name: 'IDX_notification_templates_isActive',
          columnNames: ['isActive'],
        }),
      );
    }

    // Create notification_preferences table
    if (!(await tableExists('notification_preferences'))) {
      await queryRunner.createTable(
        new Table({
          name: 'notification_preferences',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            { name: 'userId', type: 'varchar', isNullable: false },
            { name: 'entityType', type: 'varchar', isNullable: true },
            { name: 'entityId', type: 'varchar', isNullable: true },
            {
              name: 'notificationType',
              type: 'enum',
              enum: [
                'Application Submitted',
                'Application Approved',
                'Application Rejected',
                'Application Under Review',
                'Loan Disbursed',
                'Loan Active',
                'Loan Closed',
                'Loan Overdue',
                'Payment Due',
                'Payment Reminder',
                'Payment Received',
                'Payment Failed',
                'Payment Scheduled',
                'Delinquency Notice',
                'Collection Notice',
                'Final Notice',
                'Profile Updated',
                'Password Changed',
                'Document Uploaded',
                'Promotional',
                'New Product',
                'Referral Bonus',
                'System Alert',
                'Security Alert',
                'Maintenance Notice',
              ],
              isNullable: true,
            },
            {
              name: 'channel',
              type: 'enum',
              enum: ['Email', 'SMS', 'Push', 'In-App', 'WhatsApp', 'Letter'],
            },
            { name: 'enabled', type: 'boolean', default: true },
            { name: 'settings', type: 'jsonb', isNullable: true },
            { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'notification_preferences',
        new TableIndex({
          name: 'IDX_notification_preferences_userId',
          columnNames: ['userId'],
        }),
      );

      await queryRunner.createIndex(
        'notification_preferences',
        new TableIndex({
          name: 'IDX_notification_preferences_entity',
          columnNames: ['entityType', 'entityId'],
        }),
      );
    }

    // Create notification_logs table
    if (!(await tableExists('notification_logs'))) {
      await queryRunner.createTable(
        new Table({
          name: 'notification_logs',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            { name: 'recipientId', type: 'varchar', isNullable: false },
            { name: 'recipientEmail', type: 'varchar', isNullable: true },
            { name: 'recipientPhone', type: 'varchar', isNullable: true },
            {
              name: 'notificationType',
              type: 'enum',
              enum: [
                'Application Submitted',
                'Application Approved',
                'Application Rejected',
                'Application Under Review',
                'Loan Disbursed',
                'Loan Active',
                'Loan Closed',
                'Loan Overdue',
                'Payment Due',
                'Payment Reminder',
                'Payment Received',
                'Payment Failed',
                'Payment Scheduled',
                'Delinquency Notice',
                'Collection Notice',
                'Final Notice',
                'Profile Updated',
                'Password Changed',
                'Document Uploaded',
                'Promotional',
                'New Product',
                'Referral Bonus',
                'System Alert',
                'Security Alert',
                'Maintenance Notice',
              ],
            },
            {
              name: 'channel',
              type: 'enum',
              enum: ['Email', 'SMS', 'Push', 'In-App', 'WhatsApp', 'Letter'],
            },
            { name: 'subject', type: 'varchar', isNullable: false },
            { name: 'body', type: 'text', isNullable: false },
            {
              name: 'status',
              type: 'enum',
              enum: ['Pending', 'Sent', 'Delivered', 'Failed', 'Bounced', 'Opened', 'Clicked', 'Read'],
              default: "'Pending'",
            },
            { name: 'sentAt', type: 'timestamp', isNullable: true },
            { name: 'deliveredAt', type: 'timestamp', isNullable: true },
            { name: 'openedAt', type: 'timestamp', isNullable: true },
            { name: 'clickedAt', type: 'timestamp', isNullable: true },
            { name: 'readAt', type: 'timestamp', isNullable: true },
            { name: 'errorMessage', type: 'text', isNullable: true },
            { name: 'retryCount', type: 'int', default: 0 },
            { name: 'scheduledFor', type: 'timestamp', isNullable: true },
            { name: 'templateId', type: 'varchar', isNullable: true },
            { name: 'metadata', type: 'jsonb', isNullable: true },
            { name: 'providerResponse', type: 'jsonb', isNullable: true },
            { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'notification_logs',
        new TableIndex({
          name: 'IDX_notification_logs_recipientId',
          columnNames: ['recipientId'],
        }),
      );

      await queryRunner.createIndex(
        'notification_logs',
        new TableIndex({
          name: 'IDX_notification_logs_notificationType',
          columnNames: ['notificationType'],
        }),
      );

      await queryRunner.createIndex(
        'notification_logs',
        new TableIndex({
          name: 'IDX_notification_logs_status',
          columnNames: ['status'],
        }),
      );

      await queryRunner.createIndex(
        'notification_logs',
        new TableIndex({
          name: 'IDX_notification_logs_sentAt',
          columnNames: ['sentAt'],
        }),
      );

      await queryRunner.createIndex(
        'notification_logs',
        new TableIndex({
          name: 'IDX_notification_logs_channel',
          columnNames: ['channel'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notification_logs', true);
    await queryRunner.dropTable('notification_preferences', true);
    await queryRunner.dropTable('notification_templates', true);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notification_channel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notification_type_enum"`);
  }
}

