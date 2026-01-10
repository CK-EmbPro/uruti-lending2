import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMarketingTables1735000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create campaigns table
    await queryRunner.createTable(
      new Table({
        name: 'campaigns',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'campaignName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'campaignType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Draft'",
          },
          {
            name: 'targetCriteria',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'estimatedEligibleCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'actualEligibleCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'distributionChannel',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Email'",
          },
          {
            name: 'startDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'endDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'offerDetails',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'offerMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'offersSent',
            type: 'int',
            default: 0,
          },
          {
            name: 'offersViewed',
            type: 'int',
            default: 0,
          },
          {
            name: 'offersAccepted',
            type: 'int',
            default: 0,
          },
          {
            name: 'offersConverted',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalCampaignCost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'totalRevenue',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'roi',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'createdByName',
            type: 'varchar',
            length: '255',
            isNullable: false,
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
      'campaigns',
      new TableIndex({
        name: 'IDX_campaigns_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'campaigns',
      new TableIndex({
        name: 'IDX_campaigns_campaignType',
        columnNames: ['campaignType'],
      }),
    );

    await queryRunner.createIndex(
      'campaigns',
      new TableIndex({
        name: 'IDX_campaigns_startDate_endDate',
        columnNames: ['startDate', 'endDate'],
      }),
    );

    // Create pre_approved_offers table
    await queryRunner.createTable(
      new Table({
        name: 'pre_approved_offers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'campaignId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'customerId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'offerCode',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'approvedAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'interestRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'termMonths',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'additionalTerms',
            type: 'jsonb',
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
            name: 'distributionChannel',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'viewedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'acceptedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'declinedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expiredAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expiryDate',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'converted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'convertedLoanApplicationId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'convertedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'viewCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'declineReason',
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
      'pre_approved_offers',
      new TableIndex({
        name: 'IDX_pre_approved_offers_campaignId',
        columnNames: ['campaignId'],
      }),
    );

    await queryRunner.createIndex(
      'pre_approved_offers',
      new TableIndex({
        name: 'IDX_pre_approved_offers_customerId',
        columnNames: ['customerId'],
      }),
    );

    await queryRunner.createIndex(
      'pre_approved_offers',
      new TableIndex({
        name: 'IDX_pre_approved_offers_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'pre_approved_offers',
      new TableIndex({
        name: 'IDX_pre_approved_offers_offerCode',
        columnNames: ['offerCode'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'pre_approved_offers',
      new TableForeignKey({
        columnNames: ['campaignId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'campaigns',
        onDelete: 'CASCADE',
      }),
    );

    // Create campaign_responses table
    await queryRunner.createTable(
      new Table({
        name: 'campaign_responses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'campaignId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'offerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'customerId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'responseType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'responseDate',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'responseData',
            type: 'jsonb',
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
      'campaign_responses',
      new TableIndex({
        name: 'IDX_campaign_responses_campaignId',
        columnNames: ['campaignId'],
      }),
    );

    await queryRunner.createIndex(
      'campaign_responses',
      new TableIndex({
        name: 'IDX_campaign_responses_offerId',
        columnNames: ['offerId'],
      }),
    );

    await queryRunner.createIndex(
      'campaign_responses',
      new TableIndex({
        name: 'IDX_campaign_responses_customerId',
        columnNames: ['customerId'],
      }),
    );

    await queryRunner.createIndex(
      'campaign_responses',
      new TableIndex({
        name: 'IDX_campaign_responses_responseDate',
        columnNames: ['responseDate'],
      }),
    );

    await queryRunner.createForeignKey(
      'campaign_responses',
      new TableForeignKey({
        columnNames: ['campaignId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'campaigns',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'campaign_responses',
      new TableForeignKey({
        columnNames: ['offerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pre_approved_offers',
        onDelete: 'SET NULL',
      }),
    );

    // Create cross_sell_opportunities table
    await queryRunner.createTable(
      new Table({
        name: 'cross_sell_opportunities',
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
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'opportunityType',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Identified'",
          },
          {
            name: 'opportunityDetails',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'confidenceScore',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'behaviorData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'analysisNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'assignedTo',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'assignedToName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'assignedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'contactedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'contactMethod',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'contactNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'offerPresentedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'offerDetails',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'acceptedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'declinedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'convertedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'declineReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'convertedApplicationId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'identifiedAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'identifiedBy',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'identificationReason',
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
      'cross_sell_opportunities',
      new TableIndex({
        name: 'IDX_cross_sell_opportunities_customerId',
        columnNames: ['customerId'],
      }),
    );

    await queryRunner.createIndex(
      'cross_sell_opportunities',
      new TableIndex({
        name: 'IDX_cross_sell_opportunities_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'cross_sell_opportunities',
      new TableIndex({
        name: 'IDX_cross_sell_opportunities_opportunityType',
        columnNames: ['opportunityType'],
      }),
    );

    await queryRunner.createIndex(
      'cross_sell_opportunities',
      new TableIndex({
        name: 'IDX_cross_sell_opportunities_identifiedAt',
        columnNames: ['identifiedAt'],
      }),
    );

    // Create referrals table
    await queryRunner.createTable(
      new Table({
        name: 'referrals',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'referrerId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'referredCustomerId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'referralCode',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Pending'",
          },
          {
            name: 'referralDate',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'applicationDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'applicationId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'approvalDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'disbursementDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'loanId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'completionDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'bonusAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'bonusCredited',
            type: 'boolean',
            default: false,
          },
          {
            name: 'bonusCreditedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'bonusNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'referralProgramId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'programTerms',
            type: 'jsonb',
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
      'referrals',
      new TableIndex({
        name: 'IDX_referrals_referrerId',
        columnNames: ['referrerId'],
      }),
    );

    await queryRunner.createIndex(
      'referrals',
      new TableIndex({
        name: 'IDX_referrals_referredCustomerId',
        columnNames: ['referredCustomerId'],
      }),
    );

    await queryRunner.createIndex(
      'referrals',
      new TableIndex({
        name: 'IDX_referrals_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'referrals',
      new TableIndex({
        name: 'IDX_referrals_referralCode',
        columnNames: ['referralCode'],
        isUnique: true,
      }),
    );

    // Create referral_bonuses table
    await queryRunner.createTable(
      new Table({
        name: 'referral_bonuses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'referralId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'bonusType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'bonusAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'Pending'",
          },
          {
            name: 'creditedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'creditedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'creditNotes',
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
      'referral_bonuses',
      new TableIndex({
        name: 'IDX_referral_bonuses_referralId',
        columnNames: ['referralId'],
      }),
    );

    await queryRunner.createIndex(
      'referral_bonuses',
      new TableIndex({
        name: 'IDX_referral_bonuses_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createForeignKey(
      'referral_bonuses',
      new TableForeignKey({
        columnNames: ['referralId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'referrals',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const referralBonusesTable = await queryRunner.getTable('referral_bonuses');
    if (referralBonusesTable) {
      const referralBonusesForeignKey = referralBonusesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('referralId') !== -1,
      );
      if (referralBonusesForeignKey) {
        await queryRunner.dropForeignKey('referral_bonuses', referralBonusesForeignKey);
      }
    }

    const campaignResponsesTable = await queryRunner.getTable('campaign_responses');
    if (campaignResponsesTable) {
      const offerForeignKey = campaignResponsesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('offerId') !== -1,
      );
      if (offerForeignKey) {
        await queryRunner.dropForeignKey('campaign_responses', offerForeignKey);
      }
      const campaignForeignKey = campaignResponsesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('campaignId') !== -1,
      );
      if (campaignForeignKey) {
        await queryRunner.dropForeignKey('campaign_responses', campaignForeignKey);
      }
    }

    const preApprovedOffersTable = await queryRunner.getTable('pre_approved_offers');
    if (preApprovedOffersTable) {
      const campaignForeignKey = preApprovedOffersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('campaignId') !== -1,
      );
      if (campaignForeignKey) {
        await queryRunner.dropForeignKey('pre_approved_offers', campaignForeignKey);
      }
    }

    // Drop tables in reverse order
    await queryRunner.dropTable('referral_bonuses', true);
    await queryRunner.dropTable('referrals', true);
    await queryRunner.dropTable('cross_sell_opportunities', true);
    await queryRunner.dropTable('campaign_responses', true);
    await queryRunner.dropTable('pre_approved_offers', true);
    await queryRunner.dropTable('campaigns', true);
  }
}

