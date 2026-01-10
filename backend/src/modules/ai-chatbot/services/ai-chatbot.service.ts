import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotConversation, ChatbotRole, MessageType } from '../entities/chatbot-conversation.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import {
  ChatMessageDto,
  ChatResponse,
  ConversationHistory,
  StaffQueryDto,
  StaffQueryResponse,
} from '../dto/ai-chatbot.dto';
import { ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class AIChatbotService {
  private readonly logger = new Logger(AIChatbotService.name);

  constructor(
    @InjectRepository(ChatbotConversation)
    private readonly conversationRepository: Repository<ChatbotConversation>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
  ) {}

  /**
   * Handle customer chat message
   */
  async handleCustomerMessage(
    dto: ChatMessageDto,
    userId: string,
    companyId: string,
  ): Promise<ChatResponse> {
    this.logger.log(`Handling customer message from user ${userId}`);

    // Get or create conversation
    let conversation = dto.conversationId
      ? await this.conversationRepository.findOne({
          where: { id: dto.conversationId, userId, companyId },
        })
      : null;

    if (!conversation) {
      conversation = this.conversationRepository.create({
        companyId,
        userId,
        role: ChatbotRole.CUSTOMER_SUPPORT,
        messages: [],
        requiresHumanHandoff: false,
        isResolved: false,
      });
      await this.conversationRepository.save(conversation);
    }

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}`,
      type: MessageType.USER,
      content: dto.message,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(userMessage);

    // Process message and generate response
    const response = await this.processCustomerMessage(dto.message, userId, companyId, conversation);

    // Add assistant response
    const assistantMessage = {
      id: `msg-${Date.now() + 1}`,
      type: MessageType.ASSISTANT,
      content: response.response,
      timestamp: new Date().toISOString(),
      confidence: response.confidence,
    };
    conversation.messages.push(assistantMessage);

    conversation.requiresHumanHandoff = response.requiresHumanHandoff;
    if (response.requiresHumanHandoff) {
      conversation.isResolved = false;
    }

    await this.conversationRepository.save(conversation);

    return {
      ...response,
      conversationId: conversation.id,
      messageId: assistantMessage.id,
    };
  }

  /**
   * Handle staff query
   */
  async handleStaffQuery(
    dto: StaffQueryDto,
    userId: string,
    companyId: string,
  ): Promise<StaffQueryResponse> {
    this.logger.log(`Handling staff query from user ${userId}`);

    // Process query using natural language understanding
    const result = await this.processStaffQuery(dto.query, companyId, dto.context);

    return result;
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    conversationId: string,
    companyId: string,
  ): Promise<ConversationHistory> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, companyId },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    return {
      id: conversation.id,
      userId: conversation.userId,
      messages: conversation.messages,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  /**
   * Get user conversations
   */
  async getUserConversations(
    userId: string,
    companyId: string,
  ): Promise<ConversationHistory[]> {
    const conversations = await this.conversationRepository.find({
      where: { userId, companyId },
      order: { updatedAt: 'DESC' },
    });

    return conversations.map((c) => ({
      id: c.id,
      userId: c.userId,
      messages: c.messages,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  // Private helper methods

  private async processCustomerMessage(
    message: string,
    userId: string,
    companyId: string,
    conversation: ChatbotConversation,
  ): Promise<Omit<ChatResponse, 'conversationId' | 'messageId'>> {
    const lowerMessage = message.toLowerCase();
    let response = '';
    let confidence = 0.8;
    const suggestedActions: string[] = [];
    const relatedResources: Array<{ type: string; title: string; url: string }> = [];
    let requiresHumanHandoff = false;

    // Loan application status
    if (lowerMessage.includes('application') || lowerMessage.includes('status') || lowerMessage.includes('applied')) {
      const applications = await this.applicationRepository.find({
        where: { applicantId: userId, companyId },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (applications.length > 0) {
        const app = applications[0];
        response = `Your loan application ${app.applicationNumber} is currently ${app.status}. `;
        if (app.status === ApplicationStatus.APPROVED) {
          response += `Congratulations! Your application has been approved for ${app.approvedAmount || app.requestedAmount}.`;
          suggestedActions.push('View loan details', 'Accept loan offer');
        } else if (app.status === ApplicationStatus.UNDER_REVIEW) {
          response += 'Our team is reviewing your application. You will be notified once a decision is made.';
          suggestedActions.push('Check application status', 'Upload additional documents');
        } else if (app.status === ApplicationStatus.REJECTED) {
          response += 'Unfortunately, your application was not approved. Please contact us for more information.';
          requiresHumanHandoff = true;
        }
        confidence = 0.95;
      } else {
        response = "I couldn't find any loan applications in your account. Would you like to apply for a loan?";
        suggestedActions.push('Apply for a loan', 'Check eligibility');
        confidence = 0.9;
      }
    }
    // Loan status
    else if (lowerMessage.includes('loan') && (lowerMessage.includes('status') || lowerMessage.includes('balance'))) {
      const loans = await this.loanRepository.find({
        where: { applicantId: userId, companyId },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (loans.length > 0) {
        const loan = loans[0];
        const outstanding = (loan.disbursedAmount || loan.loanAmount || 0) - (loan.totalAmountPaid || 0);
        response = `Your loan ${loan.loanNumber} has an outstanding balance of ${outstanding.toFixed(2)}. `;
        response += `Status: ${loan.status}. `;
        if (loan.daysPastDue && loan.daysPastDue > 0) {
          response += `You have ${loan.daysPastDue} days past due. Please make a payment soon.`;
          suggestedActions.push('Make a payment', 'Request payment extension');
        } else {
          response += 'Your loan is in good standing.';
          suggestedActions.push('View loan details', 'Make a payment');
        }
        confidence = 0.95;
        relatedResources.push({
          type: 'loan',
          title: `Loan ${loan.loanNumber}`,
          url: `/loans/${loan.id}`,
        });
      } else {
        response = "I couldn't find any active loans in your account.";
        confidence = 0.9;
      }
    }
    // Payment
    else if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('emi')) {
      const loans = await this.loanRepository.find({
        where: { applicantId: userId, companyId, status: LoanStatus.ACTIVE },
      });

      if (loans.length > 0) {
        const loan = loans[0];
        const nextPayment = loan.repaymentStartDate || loan.postingDate;
        response = `Your next payment is due on ${nextPayment.toISOString().split('T')[0]}. `;
        response += `You can make a payment anytime through your account.`;
        suggestedActions.push('Make a payment', 'Schedule payment', 'View payment history');
        confidence = 0.9;
      } else {
        response = "I couldn't find any active loans requiring payment.";
        confidence = 0.8;
      }
    }
    // Documents
    else if (lowerMessage.includes('document') || lowerMessage.includes('upload')) {
      response = 'You can upload documents through your account dashboard. Required documents include ID proof, income proof, and address proof.';
      suggestedActions.push('Upload documents', 'View document requirements');
      confidence = 0.85;
    }
    // General help
    else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      response = 'I can help you with loan applications, loan status, payments, and documents. What would you like to know?';
      suggestedActions.push('Check application status', 'View loan details', 'Make a payment');
      confidence = 0.8;
    }
    // Default response
    else {
      response = "I'm here to help with your loan-related questions. You can ask me about your application status, loan balance, payments, or documents. How can I assist you?";
      confidence = 0.7;
      suggestedActions.push('Check application status', 'View loan details', 'Contact support');
    }

    return {
      response,
      confidence,
      suggestedActions,
      relatedResources,
      requiresHumanHandoff,
    };
  }

  private async processStaffQuery(
    query: string,
    companyId: string,
    context?: Record<string, any>,
  ): Promise<StaffQueryResponse> {
    const lowerQuery = query.toLowerCase();
    let response = '';
    let data: any = null;
    let action = 'QUERY';
    let confidence = 0.8;

    // Loan queries
    if (lowerQuery.includes('loan') && (lowerQuery.includes('dpd') || lowerQuery.includes('past due'))) {
      const dpdMatch = query.match(/(\d+)/);
      const dpdThreshold = dpdMatch ? parseInt(dpdMatch[1]) : 30;

      const loans = await this.loanRepository.find({
        where: { companyId, status: LoanStatus.ACTIVE },
      });

      const filteredLoans = loans.filter((loan) => (loan.daysPastDue || 0) > dpdThreshold);
      data = {
        count: filteredLoans.length,
        loans: filteredLoans.map((loan) => ({
          id: loan.id,
          loanNumber: loan.loanNumber,
          daysPastDue: loan.daysPastDue,
          outstanding: (loan.disbursedAmount || loan.loanAmount || 0) - (loan.totalAmountPaid || 0),
        })),
      };

      response = `Found ${filteredLoans.length} loans with DPD > ${dpdThreshold} days.`;
      action = 'QUERY_LOANS';
      confidence = 0.95;
    }
    // Application queries
    else if (lowerQuery.includes('application') && (lowerQuery.includes('pending') || lowerQuery.includes('review'))) {
      const applications = await this.applicationRepository.find({
        where: {
          companyId,
          status: ApplicationStatus.UNDER_REVIEW,
        },
      });

      data = {
        count: applications.length,
        applications: applications.map((app) => ({
          id: app.id,
          applicationNumber: app.applicationNumber,
          requestedAmount: app.requestedAmount,
          status: app.status,
        })),
      };

      response = `Found ${applications.length} applications under review.`;
      action = 'QUERY_APPLICATIONS';
      confidence = 0.95;
    }
    // Portfolio summary
    else if (lowerQuery.includes('portfolio') || lowerQuery.includes('summary')) {
      const loans = await this.loanRepository.find({
        where: { companyId },
      });

      const totalPortfolio = loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
      const activeLoans = loans.filter((loan) => loan.status === LoanStatus.ACTIVE).length;

      data = {
        totalLoans: loans.length,
        activeLoans,
        totalPortfolioValue: totalPortfolio,
      };

      response = `Portfolio summary: ${loans.length} total loans, ${activeLoans} active, total value ${totalPortfolio.toFixed(2)}.`;
      action = 'QUERY_PORTFOLIO';
      confidence = 0.9;
    }
    // Default
    else {
      response = "I can help you query loans, applications, and portfolio data. Try asking about 'loans with DPD > 30' or 'applications under review'.";
      confidence = 0.7;
    }

    return {
      response,
      data,
      action,
      confidence,
    };
  }
}

