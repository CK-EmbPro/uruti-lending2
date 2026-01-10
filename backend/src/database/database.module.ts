import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Loan } from '../modules/loan/entities/loan.entity';
import { LoanProduct } from '../modules/loan-product/entities/loan-product.entity';
import { LoanRepayment } from '../modules/loan-repayment/entities/loan-repayment.entity';
import { LoanDisbursement } from '../modules/loan-disbursement/entities/loan-disbursement.entity';
import { LoanRepaymentSchedule } from '../modules/loan/entities/loan-repayment-schedule.entity';
import { Company } from '../modules/company/entities/company.entity';
import { Currency } from '../modules/currency/entities/currency.entity';
import { User } from '../modules/auth/entities/user.entity';
import { CustomerPortalUser } from '../modules/customer-portal/entities/customer-portal-user.entity';
import { CustomerLoanLink } from '../modules/customer-portal/entities/customer-loan-link.entity';
import { LoanApplication } from '../modules/loan-application/entities/loan-application.entity';
import { LoanInterestAccrual } from '../modules/loan-interest-accrual/entities/loan-interest-accrual.entity';
import { LoanDemand } from '../modules/loan-demand/entities/loan-demand.entity';
import { LoanSecurity } from '../modules/loan-security/entities/loan-security.entity';
import { LoanSecurityShortfall } from '../modules/loan-security-shortfall/entities/loan-security-shortfall.entity';
import { LoanSecurityAssignment } from '../modules/loan-security-assignment/entities/loan-security-assignment.entity';
import { Pledge } from '../modules/loan-security-assignment/entities/pledge.entity';
import { LoanSecurityPrice } from '../modules/loan-security-price/entities/loan-security-price.entity';
import { LoanWriteOff } from '../modules/loan-write-off/entities/loan-write-off.entity';
import { LoanRefund } from '../modules/loan-refund/entities/loan-refund.entity';
import { LoanBalanceAdjustment } from '../modules/loan-balance-adjustment/entities/loan-balance-adjustment.entity';
import { LoanRestructure } from '../modules/loan-restructure/entities/loan-restructure.entity';
import { PrepaymentCharge } from '../modules/loan-repayment/entities/prepayment-charge.entity';
import { LoanCharge } from '../modules/loan-product/entities/loan-charge.entity';
import { LoanChargePosting } from '../modules/loan-charge-posting/entities/loan-charge-posting.entity';
import { JournalEntry } from '../modules/accounting/entities/journal-entry.entity';
import { GlEntry } from '../modules/accounting/entities/gl-entry.entity';
import { Account } from '../modules/accounting/entities/account.entity';
import { LoanTransfer } from '../modules/loan-transfer/entities/loan-transfer.entity';
import { Workflow } from '../modules/workflow/entities/workflow.entity';
import { WorkflowState } from '../modules/workflow/entities/workflow-state.entity';
import { WorkflowTransition } from '../modules/workflow/entities/workflow-transition.entity';
import { WorkflowAction } from '../modules/workflow/entities/workflow-action.entity';
import { WorkflowTrigger as WorkflowModuleTrigger } from '../modules/workflow/entities/workflow-trigger.entity';
import { WorkflowExecution as WorkflowModuleExecution } from '../modules/workflow/entities/workflow-execution.entity';
import { WorkflowTrigger } from '../modules/workflow-automation/entities/workflow-trigger.entity';
import { WorkflowExecution } from '../modules/workflow-automation/entities/workflow-execution.entity';
import { LoanPartner } from '../modules/loan-partner/entities/loan-partner.entity';
import { LoanPartnerShareable } from '../modules/loan-partner/entities/loan-partner-shareable.entity';
import { LoanProductLoanPartner } from '../modules/loan-product/entities/loan-product-loan-partner.entity';
import { LoanApplicationDocument } from '../modules/loan-application-document/entities/loan-application-document.entity';
import { DocumentType } from '../modules/document-type/entities/document-type.entity';
import { LoanSecurityDepositUsage } from '../modules/loan-security-deposit/entities/loan-security-deposit-usage.entity';
// Workflow Exception entities
import { Task } from '../modules/workflow-exception/entities/task.entity';
import { SLATracking } from '../modules/workflow-exception/entities/sla-tracking.entity';
import { BulkOperation } from '../modules/workflow-exception/entities/bulk-operation.entity';
// Administration entities
import { UserAccount } from '../modules/administration/entities/user-account.entity';
import { Role } from '../modules/administration/entities/role.entity';
import { Permission } from '../modules/administration/entities/permission.entity';
import { UserActivityLog } from '../modules/administration/entities/user-activity-log.entity';
import { ProductConfiguration } from '../modules/administration/entities/product-configuration.entity';
import { BusinessRule } from '../modules/administration/entities/business-rule.entity';
import { FeeSchedule } from '../modules/administration/entities/fee-schedule.entity';
import { AIDocumentProcessing } from '../modules/ai/entities/ai-document-processing.entity';
import { ChatbotConversation } from '../modules/ai/entities/chatbot-conversation.entity';
import { ChatbotMessage } from '../modules/ai/entities/chatbot-message.entity';
import { ThirdPartyPlatform } from '../modules/integration/entities/third-party-platform.entity';
import { ExternalLoanApplication } from '../modules/integration/entities/external-loan-application.entity';
import { ExternalRepayment } from '../modules/integration/entities/external-repayment.entity';
import { NotificationLog } from '../modules/notification/entities/notification-log.entity';
import { NotificationTemplate } from '../modules/notification/entities/notification-template.entity';
import { NotificationPreference } from '../modules/notification/entities/notification-preference.entity';
import { SavedSearch } from '../modules/search/entities/saved-search.entity';
import { SearchHistory } from '../modules/search/entities/search-history.entity';
import { Dashboard } from '../modules/analytics/entities/dashboard.entity';
import { DashboardWidget } from '../modules/analytics/entities/dashboard-widget.entity';
import { WhiteLabelConfiguration } from '../modules/white-label/entities/white-label.entity';
import { RevenueShareTransaction } from '../modules/white-label/entities/revenue-share-transaction.entity';
import { ServicingTask } from '../modules/loan-servicing/entities/servicing-task.entity';
import { AutoEscalationRule } from '../modules/loan-servicing/entities/auto-escalation-rule.entity';
import { PaymentRetryLog } from '../modules/loan-servicing/entities/payment-retry-log.entity';
import { CreditMonitoring } from '../modules/credit-monitoring/entities/credit-monitoring.entity';
import { CreditScoreRecord } from '../modules/credit-monitoring/entities/credit-score-record.entity';
import { CreditAlert } from '../modules/credit-monitoring/entities/credit-alert.entity';
import { CustomerPaymentMethod } from '../modules/customer-portal-enhanced/entities/payment-method.entity';
import { CustomerAutoPay } from '../modules/customer-portal-enhanced/entities/auto-pay.entity';
import { CustomerDocument } from '../modules/customer-portal-enhanced/entities/customer-document.entity';
import { CustomerCommunicationPreference } from '../modules/customer-portal-enhanced/entities/communication-preference.entity';
import { CustomerFinancialGoal } from '../modules/customer-portal-enhanced/entities/financial-goal.entity';
import { RiskModel } from '../modules/risk-modeling/entities/risk-model.entity';
import { RiskPrediction } from '../modules/risk-modeling/entities/risk-prediction.entity';
import { EarlyWarningIndicator } from '../modules/risk-modeling/entities/early-warning-indicator.entity';
import { P2PListing } from '../modules/p2p-lending/entities/p2p-listing.entity';
import { P2PInvestment } from '../modules/p2p-lending/entities/p2p-investment.entity';
import { BankConnection } from '../modules/open-banking/entities/bank-connection.entity';
import { BankAccount } from '../modules/open-banking/entities/bank-account.entity';
import { BankTransaction } from '../modules/open-banking/entities/bank-transaction.entity';
import { SocialPost } from '../modules/social-lending/entities/social-post.entity';
import { SocialPostInteraction } from '../modules/social-lending/entities/social-post-interaction.entity';
import { SocialPostComment } from '../modules/social-lending/entities/social-post-comment.entity';
import { CommunityGroup } from '../modules/social-lending/entities/community-group.entity';
import { GroupMembership } from '../modules/social-lending/entities/group-membership.entity';
import { MarketplaceListing } from '../modules/marketplace-enhanced/entities/marketplace-listing.entity';
import { BlockchainRecord } from '../modules/blockchain/entities/blockchain-record.entity';
import { SmartContract } from '../modules/blockchain/entities/smart-contract.entity';
import { AIModel } from '../modules/advanced-ai/entities/ai-model.entity';
import { AIPrediction } from '../modules/advanced-ai/entities/ai-prediction.entity';
import { Comment } from '../modules/collaboration/entities/comment.entity';
import { ActivityFeed } from '../modules/collaboration/entities/activity-feed.entity';
import { UserPresence } from '../modules/collaboration/entities/user-presence.entity';
import { Workspace } from '../modules/collaboration/entities/workspace.entity';
import { WorkspaceMember } from '../modules/collaboration/entities/workspace-member.entity';
import { ApiRoute } from '../modules/api-gateway/entities/api-route.entity';
import { RateLimitRule } from '../modules/api-gateway/entities/rate-limit-rule.entity';
import { ApiRequestLog } from '../modules/api-gateway/entities/api-request-log.entity';
import { Event } from '../modules/event-driven/entities/event.entity';
import { EventSubscription } from '../modules/event-driven/entities/event-subscription.entity';
import { EventHandler } from '../modules/event-driven/entities/event-handler.entity';
import { CustomReport } from '../modules/advanced-analytics-bi/entities/custom-report.entity';
import { AdvancedDashboard } from '../modules/advanced-analytics-bi/entities/advanced-dashboard.entity';
import { DataVisualization } from '../modules/advanced-analytics-bi/entities/data-visualization.entity';
import { DataInsight } from '../modules/advanced-analytics-bi/entities/data-insight.entity';
import { RealTimeConnection } from '../modules/real-time/entities/real-time-connection.entity';
import { RealTimeMessage } from '../modules/real-time/entities/real-time-message.entity';
import { CacheEntry } from '../modules/advanced-caching/entities/cache-entry.entity';
import { MFAConfig } from '../modules/advanced-security/entities/mfa-config.entity';
import { SSOConfig } from '../modules/advanced-security/entities/sso-config.entity';
import { SecurityAuditLog } from '../modules/advanced-security/entities/security-audit-log.entity';
import { Tenant } from '../modules/multi-tenant/entities/tenant.entity';
import { Metric } from '../modules/monitoring-observability/entities/metric.entity';
import { AlertRule } from '../modules/monitoring-observability/entities/alert-rule.entity';
import { Alert } from '../modules/monitoring-observability/entities/alert.entity';
import { FileProcessingJob } from '../modules/file-processing/entities/file-processing-job.entity';
import { RateLimitRuleEnhanced } from '../modules/rate-limiting/entities/rate-limit-rule-enhanced.entity';
import { RateLimitLog } from '../modules/rate-limiting/entities/rate-limit-log.entity';
import { ServiceRegistry } from '../modules/microservices-communication/entities/service-registry.entity';
import { ServiceCallLog } from '../modules/microservices-communication/entities/service-call-log.entity';
import { TestSuite } from '../modules/testing-qa/entities/test-suite.entity';
import { TestResult } from '../modules/testing-qa/entities/test-result.entity';
import { APIDocumentation } from '../modules/api-documentation/entities/api-documentation.entity';
import { DataMigration } from '../modules/data-migration/entities/data-migration.entity';
import { WorkflowEnhanced } from '../modules/workflow-engine-enhanced/entities/workflow-enhanced.entity';
import { WorkflowExecutionEnhanced } from '../modules/workflow-engine-enhanced/entities/workflow-execution-enhanced.entity';
import { PerformanceProfile } from '../modules/performance-optimization/entities/performance-profile.entity';
import { OptimizationRecommendation } from '../modules/performance-optimization/entities/optimization-recommendation.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
          Loan,
          LoanProduct,
          LoanCharge,
          LoanRepayment,
          PrepaymentCharge,
          LoanDisbursement,
          LoanRepaymentSchedule,
          Company,
          Currency,
          User,
          CustomerPortalUser,
          CustomerLoanLink,
          LoanApplication,
          LoanInterestAccrual,
          LoanDemand,
          LoanSecurity,
          LoanSecurityShortfall,
          LoanSecurityAssignment,
          Pledge,
          LoanSecurityPrice,
          LoanWriteOff,
          LoanRefund,
          LoanBalanceAdjustment,
          LoanRestructure,
          LoanChargePosting,
          JournalEntry,
          GlEntry,
          Account,
          LoanTransfer,
          Workflow,
          WorkflowState,
          WorkflowTransition,
          WorkflowAction,
          WorkflowModuleTrigger,
          WorkflowModuleExecution,
          WorkflowTrigger,
          WorkflowExecution,
          LoanPartner,
          LoanPartnerShareable,
          LoanProductLoanPartner,
          LoanApplicationDocument,
          DocumentType,
          LoanSecurityDepositUsage,
          // Administration entities
          UserAccount,
          Role,
          Permission,
          UserActivityLog,
          ProductConfiguration,
          BusinessRule,
          FeeSchedule,
          // Workflow Exception entities
          Task,
          SLATracking,
          BulkOperation,
          // AI entities
          AIDocumentProcessing,
          ChatbotConversation,
          ChatbotMessage,
          // Integration entities
          ThirdPartyPlatform,
          ExternalLoanApplication,
          ExternalRepayment,
          // Notification entities
          NotificationLog,
          NotificationTemplate,
          NotificationPreference,
          // Search entities
          SavedSearch,
          SearchHistory,
          // Analytics entities
          Dashboard,
          DashboardWidget,
          // White Label entities
          WhiteLabelConfiguration,
          RevenueShareTransaction,
          // Loan Servicing entities
          ServicingTask,
          AutoEscalationRule,
          PaymentRetryLog,
          // Credit Monitoring entities
          CreditMonitoring,
          CreditScoreRecord,
          CreditAlert,
          // Customer Portal Enhanced entities
          CustomerPaymentMethod,
          CustomerAutoPay,
          CustomerDocument,
          CustomerCommunicationPreference,
          CustomerFinancialGoal,
          // Risk Modeling entities
          RiskModel,
          RiskPrediction,
          EarlyWarningIndicator,
          // P2P Lending entities
          P2PListing,
          P2PInvestment,
          // Open Banking entities
          BankConnection,
          BankAccount,
          BankTransaction,
          // Social Lending entities
          SocialPost,
          SocialPostInteraction,
          SocialPostComment,
          CommunityGroup,
          GroupMembership,
          // Marketplace Enhanced entities
          MarketplaceListing,
          // Blockchain entities
          BlockchainRecord,
          SmartContract,
          // Advanced AI entities
          AIModel,
          AIPrediction,
          // Collaboration entities
          Comment,
          ActivityFeed,
          UserPresence,
          Workspace,
          WorkspaceMember,
          // API Gateway entities
          ApiRoute,
          RateLimitRule,
          ApiRequestLog,
          // Event-Driven entities
          Event,
          EventSubscription,
          EventHandler,
          // Advanced Analytics & BI entities
          CustomReport,
          AdvancedDashboard,
          DataVisualization,
          DataInsight,
          // Real-Time entities
          RealTimeConnection,
          RealTimeMessage,
          // Advanced Caching entities
          CacheEntry,
          // Advanced Security entities
          MFAConfig,
          SSOConfig,
          SecurityAuditLog,
          // Multi-Tenant entities
          Tenant,
          // Monitoring & Observability entities
          Metric,
          AlertRule,
          Alert,
          // File Processing entities
          FileProcessingJob,
          // Rate Limiting entities
          RateLimitRuleEnhanced,
          RateLimitLog,
          // Microservices Communication entities
          ServiceRegistry,
          ServiceCallLog,
          // Testing & QA entities
          TestSuite,
          TestResult,
          // API Documentation entities
          APIDocumentation,
          // Data Migration entities
          DataMigration,
          // Workflow Engine Enhanced entities
          WorkflowEnhanced,
          WorkflowExecutionEnhanced,
          // Performance Optimization entities
          PerformanceProfile,
          OptimizationRecommendation,
        ],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        extra: {
          max: 10,
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

