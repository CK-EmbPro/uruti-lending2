import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIntegrationTables1765111326660 implements MigrationInterface {
    name = 'CreateIntegrationTables1765111326660'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types if they don't exist
        const enumTypes = [
            { name: 'external_loan_applications_status_enum', values: ['Pending', 'Approved', 'Rejected', 'Disbursed', 'Repaid', 'Partial'] },
            { name: 'third_party_platforms_status_enum', values: ['Active', 'Inactive', 'Suspended'] },
            { name: 'external_repayments_status_enum', values: ['Pending', 'Processed', 'Failed', 'Reversed'] },
        ];

        for (const enumType of enumTypes) {
            const typeExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = '${enumType.name}'
                )
            `);
            if (!typeExists[0].exists) {
                await queryRunner.query(`CREATE TYPE "public"."${enumType.name}" AS ENUM(${enumType.values.map(v => `'${v}'`).join(', ')})`);
            }
        }

        // Create tables if they don't exist
        const externalLoanApplicationsTable = await queryRunner.getTable('external_loan_applications');
        if (!externalLoanApplicationsTable) {
            await queryRunner.query(`CREATE TABLE "external_loan_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "platformId" uuid NOT NULL, "externalReferenceId" character varying NOT NULL, "externalCustomerId" character varying, "loanApplicationId" uuid, "loanId" uuid, "status" "public"."external_loan_applications_status_enum" NOT NULL DEFAULT 'Pending', "tripId" character varying, "cargoOwnerId" character varying, "transporterId" character varying, "tripRevenue" numeric(15,2), "advanceAmount" numeric(15,2), "tripStartDate" date, "tripEndDate" date, "expectedRevenueDate" date, "lastWebhookSentAt" TIMESTAMP, "webhookAttempts" integer NOT NULL DEFAULT '0', "lastWebhookResponse" text, "externalData" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_831d951a06c7127a1a48e873318" UNIQUE ("externalReferenceId"), CONSTRAINT "PK_981028333c7f717ee793cb000eb" PRIMARY KEY ("id"))`);
            await queryRunner.query(`CREATE INDEX "IDX_36b5be2df6cb2596907f0ae00f" ON "external_loan_applications" ("status") `);
            await queryRunner.query(`CREATE INDEX "IDX_876cc1919e66c80a2dcf21d264" ON "external_loan_applications" ("loanId") `);
            await queryRunner.query(`CREATE INDEX "IDX_66b10f6c2fe4f575922aff412c" ON "external_loan_applications" ("loanApplicationId") `);
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_acf4f9388000e8c6e4e7bd1861" ON "external_loan_applications" ("externalReferenceId", "platformId") `);
            await queryRunner.query(`CREATE INDEX "IDX_2f52fe56e359896155782b36f8" ON "external_loan_applications" ("platformId") `);
        }

        const thirdPartyPlatformsTable = await queryRunner.getTable('third_party_platforms');
        if (!thirdPartyPlatformsTable) {
            await queryRunner.query(`CREATE TABLE "third_party_platforms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "platformCode" character varying NOT NULL, "platformName" character varying NOT NULL, "description" text, "status" "public"."third_party_platforms_status_enum" NOT NULL DEFAULT 'Active', "apiKey" character varying NOT NULL, "apiSecret" character varying, "webhookUrl" character varying, "webhookSecret" character varying, "canCreateCustomers" boolean NOT NULL DEFAULT true, "canCreateApplications" boolean NOT NULL DEFAULT true, "canPostRepayments" boolean NOT NULL DEFAULT true, "canQueryLoanStatus" boolean NOT NULL DEFAULT true, "rateLimitPerMinute" integer NOT NULL DEFAULT '1000', "metadata" jsonb, "contactEmail" character varying, "contactPhone" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" character varying, "updatedBy" character varying, CONSTRAINT "UQ_3fdd71ab19775fb27be9009f193" UNIQUE ("platformCode"), CONSTRAINT "UQ_7164382fc9fc8d9821db775aa64" UNIQUE ("apiKey"), CONSTRAINT "PK_8e8cdf4803364c37fbfe558f529" PRIMARY KEY ("id"))`);
            await queryRunner.query(`CREATE INDEX "IDX_c5ba37de2dac6bb96925cfbcb5" ON "third_party_platforms" ("status") `);
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3fdd71ab19775fb27be9009f19" ON "third_party_platforms" ("platformCode") `);
        }

        const externalRepaymentsTable = await queryRunner.getTable('external_repayments');
        if (!externalRepaymentsTable) {
            await queryRunner.query(`CREATE TABLE "external_repayments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "platformId" uuid NOT NULL, "externalReferenceId" character varying NOT NULL, "loanId" uuid NOT NULL, "repaymentId" uuid, "status" "public"."external_repayments_status_enum" NOT NULL DEFAULT 'Pending', "amount" numeric(15,2) NOT NULL, "paymentDate" date NOT NULL, "tripId" character varying, "revenueTransactionId" character varying, "totalTripRevenue" numeric(15,2), "repaymentPercentage" numeric(15,2), "processingNotes" text, "failureReason" text, "externalData" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "processedBy" character varying, "processedAt" TIMESTAMP, CONSTRAINT "UQ_a392d24756c35a13b7002d617d7" UNIQUE ("externalReferenceId"), CONSTRAINT "PK_e132cc2d5271ee1978d030e84a0" PRIMARY KEY ("id"))`);
            await queryRunner.query(`CREATE INDEX "IDX_6d30a6700a55c2e0ed77d91741" ON "external_repayments" ("status") `);
            await queryRunner.query(`CREATE INDEX "IDX_04925dbfc5fe49345540590c00" ON "external_repayments" ("repaymentId") `);
            await queryRunner.query(`CREATE INDEX "IDX_2615aa89107ef5c2ab20509c5f" ON "external_repayments" ("loanId") `);
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8670c42a5cbbff2989b840af3b" ON "external_repayments" ("externalReferenceId", "platformId") `);
            await queryRunner.query(`CREATE INDEX "IDX_c359518d902188b76868e5d0d2" ON "external_repayments" ("platformId") `);
        }

        // Create foreign keys if they don't exist
        const externalLoanApplicationsTableAfter = await queryRunner.getTable('external_loan_applications');
        if (externalLoanApplicationsTableAfter) {
            const fk1 = externalLoanApplicationsTableAfter.foreignKeys.find(fk => fk.columnNames.includes('platformId') && fk.referencedTableName === 'third_party_platforms');
            if (!fk1) {
                await queryRunner.query(`ALTER TABLE "external_loan_applications" ADD CONSTRAINT "FK_2f52fe56e359896155782b36f8f" FOREIGN KEY ("platformId") REFERENCES "third_party_platforms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
            }
            const fk2 = externalLoanApplicationsTableAfter.foreignKeys.find(fk => fk.columnNames.includes('loanApplicationId') && fk.referencedTableName === 'loan_applications');
            if (!fk2) {
                await queryRunner.query(`ALTER TABLE "external_loan_applications" ADD CONSTRAINT "FK_66b10f6c2fe4f575922aff412c6" FOREIGN KEY ("loanApplicationId") REFERENCES "loan_applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
            }
            const fk3 = externalLoanApplicationsTableAfter.foreignKeys.find(fk => fk.columnNames.includes('loanId') && fk.referencedTableName === 'loans');
            if (!fk3) {
                await queryRunner.query(`ALTER TABLE "external_loan_applications" ADD CONSTRAINT "FK_876cc1919e66c80a2dcf21d264b" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
            }
        }

        const externalRepaymentsTableAfter = await queryRunner.getTable('external_repayments');
        if (externalRepaymentsTableAfter) {
            const fk1 = externalRepaymentsTableAfter.foreignKeys.find(fk => fk.columnNames.includes('platformId') && fk.referencedTableName === 'third_party_platforms');
            if (!fk1) {
                await queryRunner.query(`ALTER TABLE "external_repayments" ADD CONSTRAINT "FK_c359518d902188b76868e5d0d2e" FOREIGN KEY ("platformId") REFERENCES "third_party_platforms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
            }
            const fk2 = externalRepaymentsTableAfter.foreignKeys.find(fk => fk.columnNames.includes('loanId') && fk.referencedTableName === 'loans');
            if (!fk2) {
                await queryRunner.query(`ALTER TABLE "external_repayments" ADD CONSTRAINT "FK_2615aa89107ef5c2ab20509c5fa" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
            }
            const fk3 = externalRepaymentsTableAfter.foreignKeys.find(fk => fk.columnNames.includes('repaymentId') && fk.referencedTableName === 'loan_repayments');
            if (!fk3) {
                await queryRunner.query(`ALTER TABLE "external_repayments" ADD CONSTRAINT "FK_04925dbfc5fe49345540590c004" FOREIGN KEY ("repaymentId") REFERENCES "loan_repayments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "external_repayments" DROP CONSTRAINT "FK_04925dbfc5fe49345540590c004"`);
        await queryRunner.query(`ALTER TABLE "external_repayments" DROP CONSTRAINT "FK_2615aa89107ef5c2ab20509c5fa"`);
        await queryRunner.query(`ALTER TABLE "external_repayments" DROP CONSTRAINT "FK_c359518d902188b76868e5d0d2e"`);
        await queryRunner.query(`ALTER TABLE "external_loan_applications" DROP CONSTRAINT "FK_876cc1919e66c80a2dcf21d264b"`);
        await queryRunner.query(`ALTER TABLE "external_loan_applications" DROP CONSTRAINT "FK_66b10f6c2fe4f575922aff412c6"`);
        await queryRunner.query(`ALTER TABLE "external_loan_applications" DROP CONSTRAINT "FK_2f52fe56e359896155782b36f8f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c359518d902188b76868e5d0d2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8670c42a5cbbff2989b840af3b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2615aa89107ef5c2ab20509c5f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_04925dbfc5fe49345540590c00"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d30a6700a55c2e0ed77d91741"`);
        await queryRunner.query(`DROP TABLE "external_repayments"`);
        await queryRunner.query(`DROP TYPE "public"."external_repayments_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3fdd71ab19775fb27be9009f19"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c5ba37de2dac6bb96925cfbcb5"`);
        await queryRunner.query(`DROP TABLE "third_party_platforms"`);
        await queryRunner.query(`DROP TYPE "public"."third_party_platforms_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f52fe56e359896155782b36f8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_acf4f9388000e8c6e4e7bd1861"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_66b10f6c2fe4f575922aff412c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_876cc1919e66c80a2dcf21d264"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_36b5be2df6cb2596907f0ae00f"`);
        await queryRunner.query(`DROP TABLE "external_loan_applications"`);
        await queryRunner.query(`DROP TYPE "public"."external_loan_applications_status_enum"`);
    }

}
