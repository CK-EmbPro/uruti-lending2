import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIChatbotService } from './services/ai-chatbot.service';
import { AIChatbotController } from './ai-chatbot.controller';
import { ChatbotConversation } from './entities/chatbot-conversation.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatbotConversation,
      LoanApplication,
      Loan,
      LoanRepayment,
    ]),
  ],
  controllers: [AIChatbotController],
  providers: [AIChatbotService],
  exports: [AIChatbotService],
})
export class AIChatbotModule {}

