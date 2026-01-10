import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateChatbotTables1765300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create chatbot_conversations table
    await queryRunner.createTable(
      new Table({
        name: 'chatbot_conversations',
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
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'sessionId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['Active', 'Archived', 'Resolved'],
            default: "'Active'",
          },
          {
            name: 'context',
            type: 'enum',
            enum: [
              'General',
              'Loan Inquiry',
              'Application Status',
              'Repayment',
              'Product Recommendation',
              'Technical Support',
              'Account Management',
            ],
            default: "'General'",
          },
          {
            name: 'title',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'messageCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'lastMessageAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'escalatedToHuman',
            type: 'boolean',
            default: false,
          },
          {
            name: 'escalatedToUserId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'escalatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'userProfile',
            type: 'jsonb',
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

    // Create indexes for chatbot_conversations
    await queryRunner.createIndex(
      'chatbot_conversations',
      new TableIndex({
        name: 'IDX_chatbot_conversations_userId_status',
        columnNames: ['userId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'chatbot_conversations',
      new TableIndex({
        name: 'IDX_chatbot_conversations_userId_createdAt',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'chatbot_conversations',
      new TableIndex({
        name: 'IDX_chatbot_conversations_context',
        columnNames: ['context'],
      }),
    );

    // Create chatbot_messages table
    await queryRunner.createTable(
      new Table({
        name: 'chatbot_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversationId',
            type: 'uuid',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['user', 'assistant', 'system'],
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['text', 'quick_reply', 'card', 'list', 'button'],
            default: "'text'",
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'context',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'systemData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'tokensUsed',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'confidence',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'isEdited',
            type: 'boolean',
            default: false,
          },
          {
            name: 'editedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'responseTime',
            type: 'int',
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

    // Create indexes for chatbot_messages
    await queryRunner.createIndex(
      'chatbot_messages',
      new TableIndex({
        name: 'IDX_chatbot_messages_conversationId_createdAt',
        columnNames: ['conversationId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'chatbot_messages',
      new TableIndex({
        name: 'IDX_chatbot_messages_role',
        columnNames: ['role'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'chatbot_messages',
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'chatbot_conversations',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable('chatbot_messages');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('conversationId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('chatbot_messages', foreignKey);
    }

    // Drop indexes
    await queryRunner.dropIndex('chatbot_messages', 'IDX_chatbot_messages_role');
    await queryRunner.dropIndex('chatbot_messages', 'IDX_chatbot_messages_conversationId_createdAt');
    await queryRunner.dropIndex('chatbot_conversations', 'IDX_chatbot_conversations_context');
    await queryRunner.dropIndex('chatbot_conversations', 'IDX_chatbot_conversations_userId_createdAt');
    await queryRunner.dropIndex('chatbot_conversations', 'IDX_chatbot_conversations_userId_status');

    // Drop tables
    await queryRunner.dropTable('chatbot_messages');
    await queryRunner.dropTable('chatbot_conversations');
  }
}

