import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIntegrationWebhookAndAuditTables1765219585687 implements MigrationInterface {
    name = 'CreateIntegrationWebhookAndAuditTables1765219585687'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."webhook_deliveries_eventtype_enum" AS ENUM('loan.status.updated', 'application.approved', 'application.rejected', 'repayment.posted', 'customer.created')`);
        await queryRunner.query(`CREATE TYPE "public"."webhook_deliveries_status_enum" AS ENUM('Pending', 'Success', 'Failed', 'Retrying')`);
        await queryRunner.query(`CREATE TABLE "webhook_deliveries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "platformId" uuid NOT NULL, "eventType" "public"."webhook_deliveries_eventtype_enum" NOT NULL, "payload" jsonb NOT NULL, "status" "public"."webhook_deliveries_status_enum" NOT NULL DEFAULT 'Pending', "attemptCount" integer NOT NULL DEFAULT '0', "maxAttempts" integer NOT NULL DEFAULT '3', "webhookUrl" character varying, "responseStatus" integer, "responseBody" text, "errorMessage" text, "deliveredAt" TIMESTAMP, "nextRetryAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP, CONSTRAINT "PK_535dd409947fb6d8fc6dfc0112a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_51116c3604467d24506f0b567e" ON "webhook_deliveries" ("eventType") `);
        await queryRunner.query(`CREATE INDEX "IDX_70ed9c0fbee59fa1e378fc04fa" ON "webhook_deliveries" ("platformId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_9ba38b0742b00141b495807fcb" ON "webhook_deliveries" ("platformId", "status") `);
        await queryRunner.query(`CREATE TYPE "public"."integration_audit_logs_actiontype_enum" AS ENUM('platform.created', 'platform.updated', 'platform.deleted', 'api_key.regenerated', 'webhook_secret.regenerated', 'permissions.updated', 'status.changed', 'webhook.tested')`);
        await queryRunner.query(`CREATE TABLE "integration_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "platformId" uuid, "actionType" "public"."integration_audit_logs_actiontype_enum" NOT NULL, "userId" character varying NOT NULL, "userName" character varying, "userEmail" character varying, "oldValues" jsonb, "newValues" jsonb, "description" text, "ipAddress" character varying, "userAgent" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b9fbcf2db7632b74656f29e2974" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f32ebae6115e54e500b5440139" ON "integration_audit_logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_abd21682e839e97907e8cfea3f" ON "integration_audit_logs" ("actionType") `);
        await queryRunner.query(`CREATE INDEX "IDX_3aaae723e40960405bdf35ede9" ON "integration_audit_logs" ("platformId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "FK_9f40747b619106655d2b4d518e7" FOREIGN KEY ("platformId") REFERENCES "third_party_platforms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "integration_audit_logs" ADD CONSTRAINT "FK_695ad7cff6a9beb240917284c1b" FOREIGN KEY ("platformId") REFERENCES "third_party_platforms"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "integration_audit_logs" DROP CONSTRAINT "FK_695ad7cff6a9beb240917284c1b"`);
        await queryRunner.query(`ALTER TABLE "webhook_deliveries" DROP CONSTRAINT "FK_9f40747b619106655d2b4d518e7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3aaae723e40960405bdf35ede9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_abd21682e839e97907e8cfea3f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f32ebae6115e54e500b5440139"`);
        await queryRunner.query(`DROP TABLE "integration_audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."integration_audit_logs_actiontype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ba38b0742b00141b495807fcb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_70ed9c0fbee59fa1e378fc04fa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_51116c3604467d24506f0b567e"`);
        await queryRunner.query(`DROP TABLE "webhook_deliveries"`);
        await queryRunner.query(`DROP TYPE "public"."webhook_deliveries_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."webhook_deliveries_eventtype_enum"`);
    }

}
