import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { LoanModule } from './modules/loan/loan.module';
import { LoanProductModule } from './modules/loan-product/loan-product.module';
import { LoanApplicationModule } from './modules/loan-application/loan-application.module';
import { LoanRepaymentModule } from './modules/loan-repayment/loan-repayment.module';
import { LoanDisbursementModule } from './modules/loan-disbursement/loan-disbursement.module';
import { LoanDemandModule } from './modules/loan-demand/loan-demand.module';
import { LoanInterestAccrualModule } from './modules/loan-interest-accrual/loan-interest-accrual.module';
import { LoanSecurityModule } from './modules/loan-security/loan-security.module';
import { LoanSecurityAssignmentModule } from './modules/loan-security-assignment/loan-security-assignment.module';
import { LoanSecurityPriceModule } from './modules/loan-security-price/loan-security-price.module';
import { LoanSecurityShortfallModule } from './modules/loan-security-shortfall/loan-security-shortfall.module';
import { LoanChargePostingModule } from './modules/loan-charge-posting/loan-charge-posting.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { CustomerModule } from './modules/customer/customer.module';
import { LoanTransferModule } from './modules/loan-transfer/loan-transfer.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { LoanPartnerModule } from './modules/loan-partner/loan-partner.module';
import { LoanApplicationDocumentModule } from './modules/loan-application-document/loan-application-document.module';
import { DocumentTypeModule } from './modules/document-type/document-type.module';
import { LoanSecurityDepositModule } from './modules/loan-security-deposit/loan-security-deposit.module';
import { LoanWriteOffModule } from './modules/loan-write-off/loan-write-off.module';
import { LoanRefundModule } from './modules/loan-refund/loan-refund.module';
import { LoanBalanceAdjustmentModule } from './modules/loan-balance-adjustment/loan-balance-adjustment.module';
import { LoanRestructureModule } from './modules/loan-restructure/loan-restructure.module';
import { CalculationModule } from './modules/calculation/calculation.module';
import { LoanCalculatorModule } from './modules/loan-calculator/loan-calculator.module';
import { PaymentReminderModule } from './modules/payment-reminder/payment-reminder.module';
import { ApplicationPrefillModule } from './modules/application-prefill/application-prefill.module';
import { ApprovalPredictorModule } from './modules/approval-predictor/approval-predictor.module';
import { LoanTrackerModule } from './modules/loan-tracker/loan-tracker.module';
import { FinancialHealthModule } from './modules/financial-health/financial-health.module';
import { PreApprovalModule } from './modules/pre-approval/pre-approval.module';
import { DocumentClassificationModule } from './modules/document-classification/document-classification.module';
import { PortfolioAnalyticsModule } from './modules/portfolio-analytics/portfolio-analytics.module';
import { OnboardingAssistantModule } from './modules/onboarding-assistant/onboarding-assistant.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { FastDecisionModule } from './modules/fast-decision/fast-decision.module';
import { SmartProductMatchingModule } from './modules/smart-product-matching/smart-product-matching.module';
import { CreditDecisioningModule } from './modules/credit-decisioning/credit-decisioning.module';
import { DynamicPricingModule } from './modules/dynamic-pricing/dynamic-pricing.module';
import { FraudDetectionModule } from './modules/fraud-detection/fraud-detection.module';
import { ReferralProgramModule } from './modules/referral-program/referral-program.module';
import { ComplianceMonitoringModule } from './modules/compliance-monitoring/compliance-monitoring.module';
import { ESignatureModule } from './modules/e-signature/e-signature.module';
import { WorkflowAutomationModule } from './modules/workflow-automation/workflow-automation.module';
import { ExecutiveBIModule } from './modules/executive-bi/executive-bi.module';
import { DataImportExportModule } from './modules/data-import-export/data-import-export.module';
import { MarketingAutomationModule } from './modules/marketing-automation/marketing-automation.module';
import { TaskManagementModule } from './modules/task-management/task-management.module';
import { AIChatbotModule } from './modules/ai-chatbot/ai-chatbot.module';
import { APIMarketplaceModule } from './modules/api-marketplace/api-marketplace.module';
import { I18nModule } from './modules/i18n/i18n.module';
import { AdvancedSearchModule } from './modules/advanced-search/advanced-search.module';
import { AdvancedAnalyticsModule } from './modules/advanced-analytics/advanced-analytics.module';
import { CustomerJourneyModule } from './modules/customer-journey/customer-journey.module';
import { IntegrationHubModule } from './modules/integration-hub/integration-hub.module';
import { PerformanceMonitoringModule } from './modules/performance-monitoring/performance-monitoring.module';
import { AdvancedSecurityModule } from './modules/advanced-security/advanced-security.module';
import { BackupRecoveryModule } from './modules/backup-recovery/backup-recovery.module';
import { AdvancedReportingModule } from './modules/advanced-reporting/advanced-reporting.module';
import { JsReportModule } from './modules/jsreport/jsreport.module';
import { QRCodeModule } from './modules/qrcode/qrcode.module';
import { ExcelModule } from './modules/excel/excel.module';
import { EmailModule } from './modules/email/email.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { AppCacheModule } from './modules/cache/cache.module';
import { PDFModule } from './modules/pdf/pdf.module';
import { ImageModule } from './modules/image/image.module';
import { BarcodeModule } from './modules/barcode/barcode.module';
import { MobileApiModule } from './modules/mobile-api/mobile-api.module';
import { AdvancedDocumentManagementModule } from './modules/advanced-document-management/advanced-document-management.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { AdvancedCachingModule } from './modules/advanced-caching/advanced-caching.module';
import { CreditBureauModule } from './modules/credit-bureau/credit-bureau.module';
import { VisualRuleBuilderModule } from './modules/visual-rule-builder/visual-rule-builder.module';
import { RegulatoryReportingModule } from './modules/regulatory-reporting/regulatory-reporting.module';
import { AlternativeCreditScoringModule } from './modules/alternative-credit-scoring/alternative-credit-scoring.module';
import { CollectionsAnalyticsModule } from './modules/collections-analytics/collections-analytics.module';
import { WhiteLabelModule } from './modules/white-label/white-label.module';
import { LoanServicingModule } from './modules/loan-servicing/loan-servicing.module';
import { CreditMonitoringModule } from './modules/credit-monitoring/credit-monitoring.module';
import { CustomerPortalEnhancedModule } from './modules/customer-portal-enhanced/customer-portal-enhanced.module';
import { RiskModelingModule } from './modules/risk-modeling/risk-modeling.module';
import { P2PLendingModule } from './modules/p2p-lending/p2p-lending.module';
import { OpenBankingModule } from './modules/open-banking/open-banking.module';
import { RevenueBasedRepaymentModule } from './modules/revenue-based-repayment/revenue-based-repayment.module';
import { SocialLendingModule } from './modules/social-lending/social-lending.module';
import { MarketplaceEnhancedModule } from './modules/marketplace-enhanced/marketplace-enhanced.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { AdvancedAIModule } from './modules/advanced-ai/advanced-ai.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { ApiGatewayModule } from './modules/api-gateway/api-gateway.module';
import { EventDrivenModule } from './modules/event-driven/event-driven.module';
import { AdvancedAnalyticsBIModule } from './modules/advanced-analytics-bi/advanced-analytics-bi.module';
import { RealTimeModule } from './modules/real-time/real-time.module';
import { GraphQLApiModule } from './modules/graphql/graphql.module';
import { MultiTenantModule } from './modules/multi-tenant/multi-tenant.module';
import { MonitoringObservabilityModule } from './modules/monitoring-observability/monitoring-observability.module';
import { ElasticsearchModule } from './modules/elasticsearch/elasticsearch.module';
import { FileProcessingModule } from './modules/file-processing/file-processing.module';
import { RateLimitingModule } from './modules/rate-limiting/rate-limiting.module';
import { MicroservicesCommunicationModule } from './modules/microservices-communication/microservices-communication.module';
import { TestingQAModule } from './modules/testing-qa/testing-qa.module';
import { APIDocumentationModule } from './modules/api-documentation/api-documentation.module';
import { DataMigrationModule } from './modules/data-migration/data-migration.module';
import { WorkflowEngineEnhancedModule } from './modules/workflow-engine-enhanced/workflow-engine-enhanced.module';
import { PerformanceOptimizationModule } from './modules/performance-optimization/performance-optimization.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { PreQualificationModule } from './modules/pre-qualification/pre-qualification.module';
import { CreditAssessmentModule } from './modules/credit-assessment/credit-assessment.module';
import { LoanBookingModule } from './modules/loan-booking/loan-booking.module';
import { PaymentProcessingModule } from './modules/payment-processing/payment-processing.module';
import { AccountManagementModule } from './modules/account-management/account-management.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { CustomerServiceModule } from './modules/customer-service/customer-service.module';
import { RiskManagementModule } from './modules/risk-management/risk-management.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AdministrationModule } from './modules/administration/administration.module';
import { WorkflowExceptionModule } from './modules/workflow-exception/workflow-exception.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { AIModule } from './modules/ai/ai.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SearchModule } from './modules/search/search.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';
import { CustomerPortalModule } from './modules/customer-portal/customer-portal.module';
import { PredictiveAnalyticsModule } from './modules/predictive-analytics/predictive-analytics.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { CreditScoringEngineModule } from './modules/credit-scoring-engine/credit-scoring-engine.module';
import { AutoProcessingModule } from './modules/auto-processing/auto-processing.module';
import { DefaultMonitoringModule } from './modules/default-monitoring/default-monitoring.module';
import { RiskPricingModule } from './modules/risk-pricing/risk-pricing.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { BullModule } from '@nestjs/bull';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    DatabaseModule,

    // Bull Queue Configuration (for async job processing)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST') || configService.get('redis.host') || 'localhost';
        const redisPort = configService.get('REDIS_PORT') || configService.get('redis.port') || 6379;
        const redisPassword = configService.get('REDIS_PASSWORD') || configService.get('redis.password') || undefined;

        return {
          redis: {
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            retryStrategy: (times: number) => {
              const delay = Math.min(times * 50, 2000);
              return delay;
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    // Scheduler
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),

    // Feature Modules
    AuthModule,
    CompanyModule,
    LoanProductModule,
    LoanApplicationModule,
    LoanModule,
    LoanDisbursementModule,
    LoanRepaymentModule,
    RevenueBasedRepaymentModule,
    LoanDemandModule,
    LoanInterestAccrualModule,
    LoanSecurityModule,
    LoanSecurityAssignmentModule,
    LoanSecurityPriceModule,
    LoanSecurityShortfallModule,
    LoanChargePostingModule,
    ReportingModule,
    CustomerModule,
    LoanTransferModule,
    WorkflowModule,
    LoanPartnerModule,
    LoanApplicationDocumentModule,
    DocumentTypeModule,
    LoanSecurityDepositModule,
    LoanWriteOffModule,
    LoanRefundModule,
    LoanBalanceAdjustmentModule,
    LoanRestructureModule,
    CalculationModule,
    LoanCalculatorModule,
    PaymentReminderModule,
    ApplicationPrefillModule,
    ApprovalPredictorModule,
    LoanTrackerModule,
    FinancialHealthModule,
    PreApprovalModule,
    DocumentClassificationModule,
    PortfolioAnalyticsModule,
    OnboardingAssistantModule,
    OnboardingModule,
    FastDecisionModule,
    SmartProductMatchingModule,
    CreditDecisioningModule,
    DynamicPricingModule,
    FraudDetectionModule,
    ReferralProgramModule,
    ComplianceMonitoringModule,
    ESignatureModule,
    WorkflowAutomationModule,
    ExecutiveBIModule,
    DataImportExportModule,
    MarketingAutomationModule,
    TaskManagementModule,
    AIChatbotModule,
    APIMarketplaceModule,
    I18nModule,
    AdvancedSearchModule,
    AdvancedAnalyticsModule,
    CustomerJourneyModule,
    IntegrationHubModule,
    PerformanceMonitoringModule,
    AdvancedSecurityModule,
    BackupRecoveryModule,
    AdvancedReportingModule,
    JsReportModule,
    QRCodeModule,
    ExcelModule,
    EmailModule,
    FileUploadModule,
    AppCacheModule,
    PDFModule,
    ImageModule,
    BarcodeModule,
    MobileApiModule,
    AdvancedDocumentManagementModule,
    CustomFieldsModule,
    AdvancedCachingModule,
    CreditBureauModule,
    VisualRuleBuilderModule,
    RegulatoryReportingModule,
    AlternativeCreditScoringModule,
    CollectionsAnalyticsModule,
    WhiteLabelModule,
    LoanServicingModule,
    CreditMonitoringModule,
    CustomerPortalEnhancedModule,
    RiskModelingModule,
    P2PLendingModule,
    OpenBankingModule,
    SocialLendingModule,
    MarketplaceEnhancedModule,
    BlockchainModule,
    AdvancedAIModule,
    CollaborationModule,
    ApiGatewayModule,
    EventDrivenModule,
    AdvancedAnalyticsBIModule,
    RealTimeModule,
    GraphQLApiModule,
    AdvancedCachingModule,
    AdvancedSecurityModule,
    MultiTenantModule,
    MonitoringObservabilityModule,
    ElasticsearchModule,
    FileProcessingModule,
    RateLimitingModule,
    MicroservicesCommunicationModule,
    TestingQAModule,
    APIDocumentationModule,
    DataMigrationModule,
    WorkflowEngineEnhancedModule,
    PerformanceOptimizationModule,
    SchedulerModule,
    PreQualificationModule,
    CreditAssessmentModule,
    LoanBookingModule,
    PaymentProcessingModule,
    AccountManagementModule,
    CollectionsModule,
    CustomerServiceModule,
    RiskManagementModule,
    ComplianceModule,
    AdministrationModule,
    WorkflowExceptionModule,
    MarketingModule,
    AIModule,
    IntegrationModule,
    NotificationModule,
    SearchModule,
    AnalyticsModule,
    HealthModule,
    CustomerPortalModule,
    OpenBankingModule,
    PredictiveAnalyticsModule,
    CurrencyModule,
    GamificationModule,
    CreditScoringEngineModule,
    AutoProcessingModule,
    DefaultMonitoringModule,
    RiskPricingModule,
    AccountingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

