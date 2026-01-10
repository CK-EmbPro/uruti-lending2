import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIController } from './ai.controller';
import { AIDocumentProcessorService } from './services/ai-document-processor.service';
import { LoanApplicationModule } from '../loan-application/loan-application.module';
import { LoanApplicationDocumentModule } from '../loan-application-document/loan-application-document.module';
import { AIApplicationFillerService } from './services/ai-application-filler.service';
import { AIProductRecommendationService } from './services/ai-product-recommendation.service';
import { AIEligibilityAssessmentService } from './services/ai-eligibility-assessment.service';
import { AIDocumentProcessing } from './entities/ai-document-processing.entity';
import { ChatbotConversation } from './entities/chatbot-conversation.entity';
import { ChatbotMessage } from './entities/chatbot-message.entity';
import { LoanProductModule } from '../loan-product/loan-product.module';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { CompanyModule } from '../company/company.module';
import { LoanModule } from '../loan/loan.module';
import { CustomerModule } from '../customer/customer.module';
import { ChatbotService } from './services/chatbot.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AIDocumentProcessing, LoanProduct, ChatbotConversation, ChatbotMessage, LoanApplication]),
    forwardRef(() => LoanApplicationModule),
    LoanApplicationDocumentModule,
    LoanProductModule,
    forwardRef(() => LoanModule),
    CustomerModule,
    CompanyModule,
  ],
  controllers: [AIController],
  providers: [
    AIDocumentProcessorService,
    AIApplicationFillerService,
    AIProductRecommendationService,
    AIEligibilityAssessmentService,
    ChatbotService,
  ],
  exports: [
    AIDocumentProcessorService,
    AIApplicationFillerService,
    AIProductRecommendationService,
    AIEligibilityAssessmentService,
    ChatbotService,
  ],
})
export class AIModule {}

