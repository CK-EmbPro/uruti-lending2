import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChatbotConversation, ConversationStatus, ConversationContext } from '../entities/chatbot-conversation.entity';
import { ChatbotMessage, MessageRole, MessageType } from '../entities/chatbot-message.entity';
import { SendMessageDto, ChatbotResponseDto } from '../dto/chatbot.dto';
import { LoanService } from '../../loan/loan.service';
import { LoanApplicationService } from '../../loan-application/loan-application.service';
import { LoanProductService } from '../../loan-product/loan-product.service';
import { CustomerService } from '../../customer/customer.service';
import { AIProductRecommendationService } from './ai-product-recommendation.service';
import { AIEligibilityAssessmentService } from './ai-eligibility-assessment.service';
import axios from 'axios';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly geminiApiKey?: string;
  private readonly openaiApiKey?: string;
  private readonly aiProvider: string;
  private readonly useAI: boolean;

  constructor(
    @InjectRepository(ChatbotConversation)
    private readonly conversationRepository: Repository<ChatbotConversation>,
    @InjectRepository(ChatbotMessage)
    private readonly messageRepository: Repository<ChatbotMessage>,
    private readonly configService: ConfigService,
    private readonly loanService: LoanService,
    private readonly loanApplicationService: LoanApplicationService,
    private readonly loanProductService: LoanProductService,
    private readonly customerService: CustomerService,
    private readonly aiProductRecommendationService: AIProductRecommendationService,
    private readonly aiEligibilityAssessmentService: AIEligibilityAssessmentService,
  ) {
    this.aiProvider = this.configService.get('AI_PROVIDER') || 'gemini';
    this.geminiApiKey = this.configService.get('GEMINI_API_KEY') || '';
    this.openaiApiKey = this.configService.get('OPENAI_API_KEY');
    this.useAI = !!(this.geminiApiKey || this.openaiApiKey);
  }

  /**
   * Send a message and get chatbot response
   */
  async sendMessage(
    userId: string | null,
    sessionId: string | null,
    dto: SendMessageDto,
  ): Promise<ChatbotResponseDto> {
    const startTime = Date.now();

    // Get or create conversation
    // Don't load messages relation to avoid TypeORM trying to sync/update them
    let conversation: ChatbotConversation;
    if (dto.conversationId) {
      conversation = await this.conversationRepository.findOne({
        where: { id: dto.conversationId },
        // Don't load messages relation - we'll query them separately if needed
      });
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
    } else {
      conversation = await this.createConversation(userId, sessionId, dto.context || ConversationContext.GENERAL);
    }

    // Ensure conversation has an ID (should be set after save, but double-check)
    if (!conversation.id) {
      throw new BadRequestException('Conversation ID is missing');
    }

    // Save user message - create new entity with explicit conversationId
    const userMessage = this.messageRepository.create({
      conversationId: conversation.id,
      role: MessageRole.USER,
      type: MessageType.TEXT,
      content: dto.message,
      metadata: dto.metadata || {},
    });
    
    // Explicitly ensure conversationId is set and conversation relation is not set
    (userMessage as any).conversation = undefined;
    userMessage.conversationId = conversation.id;
    
    const savedUserMessage = await this.messageRepository.save(userMessage);
    
    // Verify user message was saved correctly
    if (!savedUserMessage || !savedUserMessage.conversationId) {
      this.logger.error(`Failed to save user message. Conversation ID: ${conversation.id}`);
      throw new BadRequestException('Failed to save user message: conversationId not set');
    }

    // Update conversation
    conversation.messageCount += 1;
    conversation.lastMessageAt = new Date();
    if (!conversation.title && dto.message.length <= 100) {
      conversation.title = dto.message.substring(0, 100);
    }
    await this.conversationRepository.save(conversation);

    // Get conversation history
    const messages = await this.messageRepository.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'ASC' },
    });

    // Analyze user intent and retrieve relevant system data
    const systemData = await this.retrieveSystemData(userId, dto.message, conversation.context);

    // Generate response
    const response = await this.generateResponse(
      dto.message,
      messages,
      conversation,
      systemData,
    );

    // Save assistant message - ensure conversationId is set
    if (!conversation.id) {
      throw new BadRequestException('Conversation ID is missing when saving assistant message');
    }
    
    // Create message with only conversationId (not the relation object)
    const assistantMessage = this.messageRepository.create({
      conversationId: conversation.id,
      role: MessageRole.ASSISTANT,
      type: response.type || MessageType.TEXT,
      content: response.message,
      metadata: response.metadata || {},
      context: { systemData },
      systemData: response.systemData,
      tokensUsed: response.metadata?.tokensUsed,
      confidence: response.confidence,
      responseTime: Date.now() - startTime,
    });
    
    // Explicitly ensure conversationId is set and conversation relation is not set
    (assistantMessage as any).conversation = undefined;
    assistantMessage.conversationId = conversation.id;
    
    // Save the message - don't set the conversation relation, only conversationId
    const savedAssistantMessage = await this.messageRepository.save(assistantMessage);
    
    // Verify the message was saved with conversationId
    if (!savedAssistantMessage || !savedAssistantMessage.conversationId) {
      this.logger.error(`Failed to save assistant message. Conversation ID: ${conversation.id}, Message ID: ${savedAssistantMessage?.id}`);
      throw new BadRequestException('Failed to save assistant message: conversationId not set');
    }

    // Update conversation (without messages relation to avoid sync issues)
    conversation.messageCount += 1;
    conversation.lastMessageAt = new Date();
    // Clear messages relation before saving to prevent TypeORM from trying to sync
    conversation.messages = undefined;
    await this.conversationRepository.save(conversation);

    return {
      message: response.message,
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      quickReplies: response.quickReplies,
      type: response.type,
      metadata: response.metadata,
      confidence: response.confidence,
      systemData: response.systemData,
    };
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string | null,
    sessionId: string | null,
    context: ConversationContext = ConversationContext.GENERAL,
  ): Promise<ChatbotConversation> {
    const conversation = this.conversationRepository.create({
      userId,
      sessionId: sessionId || this.generateSessionId(),
      status: ConversationStatus.ACTIVE,
      context,
      messageCount: 0,
    });

    // Load user profile if userId provided
    // Note: Customer service may not have a direct findById method
    // We'll skip profile loading for now to avoid errors
    // Profile can be loaded later when needed

    return this.conversationRepository.save(conversation);
  }

  /**
   * Get conversation with messages
   */
  async getConversation(conversationId: string, userId?: string): Promise<ChatbotConversation> {
    const where: any = { id: conversationId };
    if (userId) {
      where.userId = userId;
    }

    const conversation = await this.conversationRepository.findOne({
      where,
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  /**
   * Get user conversations
   */
  async getUserConversations(
    userId: string | null,
    sessionId: string | null,
    limit: number = 20,
  ): Promise<ChatbotConversation[]> {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    } else if (sessionId) {
      where.sessionId = sessionId;
    } else {
      return [];
    }

    return this.conversationRepository.find({
      where,
      order: { lastMessageAt: 'DESC' },
      take: limit,
      relations: ['messages'],
    });
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string, userId?: string): Promise<void> {
    const where: any = { id: conversationId };
    if (userId) {
      where.userId = userId;
    }

    const conversation = await this.conversationRepository.findOne({ where });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.status = ConversationStatus.ARCHIVED;
    await this.conversationRepository.save(conversation);
  }

  /**
   * Retrieve relevant system data based on user query
   */
  private async retrieveSystemData(
    userId: string | null,
    message: string,
    context: ConversationContext,
  ): Promise<Record<string, any>> {
    const systemData: Record<string, any> = {};

    if (!userId) {
      return systemData;
    }

    const lowerMessage = message.toLowerCase();

    // Check for loan-related queries
    if (lowerMessage.includes('loan') || lowerMessage.includes('application') || lowerMessage.includes('status')) {
      try {
        // Get user's loans - query by applicantId directly
        try {
          // Note: findAll requires companyId, but we don't have it in this context
          // For now, we'll skip this or use a workaround
          // TODO: Get companyId from user context or pass it as parameter
          const userLoans: any[] = [];
          systemData.loans = userLoans.map((loan) => ({
            id: loan.id,
            loanNumber: loan.loanNumber,
            status: loan.status,
            loanAmount: loan.loanAmount,
            outstandingBalance: Number(loan.loanAmount) - Number(loan.totalPrincipalPaid || 0),
          }));
        } catch (error) {
          this.logger.warn(`Could not retrieve loans for user ${userId}`);
        }

        // Get user's applications - query by applicantId directly
        try {
          // Note: findAll requires companyId, but we don't have it in this context
          // For now, we'll skip this or use a workaround
          // TODO: Get companyId from user context or pass it as parameter
          const userApplications: any[] = [];
          systemData.applications = userApplications.map((app) => ({
            id: app.id,
            status: app.status,
            requestedAmount: app.requestedAmount,
          }));
        } catch (error) {
          this.logger.warn(`Could not retrieve applications for user ${userId}`);
        }
      } catch (error) {
        this.logger.warn(`Could not retrieve loans/applications for user ${userId}`);
      }
    }

    // Check for product-related queries
    if (lowerMessage.includes('product') || lowerMessage.includes('recommend') || lowerMessage.includes('eligibility')) {
      try {
        const products = await this.loanProductService.findAll();
        systemData.products = products.map((product) => ({
          id: product.id,
          productCode: product.productCode,
          productName: product.productName,
          rateOfInterest: product.rateOfInterest,
        }));
      } catch (error) {
        this.logger.warn('Could not retrieve loan products');
      }
    }

    return systemData;
  }

  /**
   * Generate chatbot response using AI
   */
  private async generateResponse(
    userMessage: string,
    conversationHistory: ChatbotMessage[],
    conversation: ChatbotConversation,
    systemData: Record<string, any>,
  ): Promise<{
    message: string;
    type: MessageType;
    quickReplies?: string[];
    metadata?: Record<string, any>;
    confidence?: number;
    systemData?: Record<string, any>;
  }> {
    // Build context from conversation history
    const historyContext = conversationHistory
      .slice(-10) // Last 10 messages for context
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Build system prompt with knowledge base
    const systemPrompt = this.buildSystemPrompt(conversation.context, systemData, conversation.userProfile);

    // Build messages array for AI (works for both Gemini and OpenAI)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map((msg) => ({
        role: msg.role === MessageRole.USER ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    if (this.useAI) {
      // Try Gemini first, then OpenAI, then fallback
      if (this.geminiApiKey) {
        try {
          return await this.generateGeminiResponse(messages, systemData);
        } catch (error: any) {
          this.logger.error(`Gemini API error: ${error.message}`, error.stack);
          // Fallback to OpenAI or rule-based
          if (this.openaiApiKey) {
            try {
              return await this.generateOpenAIResponse(messages, systemData);
            } catch (openaiError: any) {
              this.logger.error(`OpenAI API error: ${openaiError.message}`);
              return this.generateFallbackResponse(userMessage, systemData);
            }
          } else {
            return this.generateFallbackResponse(userMessage, systemData);
          }
        }
      } else if (this.openaiApiKey) {
        try {
          return await this.generateOpenAIResponse(messages, systemData);
        } catch (error: any) {
          this.logger.error(`OpenAI API error: ${error.message}`, error.stack);
          return this.generateFallbackResponse(userMessage, systemData);
        }
      }
    }
    
    // Use rule-based responses when AI is not available
    return this.generateFallbackResponse(userMessage, systemData);
  }

  /**
   * Build system prompt with knowledge base
   */
  private buildSystemPrompt(
    context: ConversationContext,
    systemData: Record<string, any>,
    userProfile?: Record<string, any>,
  ): string {
    let prompt = `You are a helpful and friendly AI assistant for Uruti Lending Platform, a financial services company that provides loans and financial solutions.

CRITICAL INSTRUCTIONS FOR CLEAR RESPONSES:
1. Always provide clear, direct answers to user questions
2. Use simple, easy-to-understand language - avoid jargon unless necessary
3. Format numbers clearly (e.g., "KES 50,000" not "50000")
4. Break down complex information into bullet points when helpful
5. Always provide specific details when available (loan numbers, amounts, dates, statuses)
6. If data is missing, clearly state what information is not available
7. End responses with a helpful question or next step suggestion
8. Be concise but complete - aim for 2-4 sentences for simple queries, up to 6 for complex ones

Your role is to assist users with:
- Loan inquiries and product information
- Application status checks
- Repayment information and schedules
- Account management
- General questions about the platform

Response Style:
- Be professional, friendly, and empathetic
- Use active voice ("Your loan is active" not "The loan status is active")
- Provide specific numbers, dates, and statuses when available
- Format information clearly (use line breaks, bullet points for lists)
- Always offer next steps or additional help

IMPORTANT: 
- If you see user data (loans, applications), use it to give specific, personalized answers
- If no data is available, clearly explain what the user can do next
- Never make up information - only use what's provided in the system data
`;

    if (userProfile) {
      prompt += `\nUser Profile:
- Name: ${userProfile.name || 'Not provided'}
- Email: ${userProfile.email || 'Not provided'}
`;
    }

    if (systemData.loans && systemData.loans.length > 0) {
      prompt += `\n\nUSER'S LOANS (Use this data to answer loan-related questions):
${systemData.loans.map((loan: any, idx: number) => 
  `${idx + 1}. Loan Number: ${loan.loanNumber || 'N/A'}
   Status: ${loan.status || 'Unknown'}
   Loan Amount: ${loan.loanAmount ? `KES ${Number(loan.loanAmount).toLocaleString()}` : 'N/A'}
   Outstanding Balance: ${loan.outstandingBalance ? `KES ${Number(loan.outstandingBalance).toLocaleString()}` : 'N/A'}`
).join('\n')}\n`;
    } else {
      prompt += `\n\nUSER'S LOANS: No active loans found in the system.\n`;
    }

    if (systemData.applications && systemData.applications.length > 0) {
      prompt += `\n\nUSER'S LOAN APPLICATIONS (Use this data to answer application questions):
${systemData.applications.map((app: any, idx: number) => 
  `${idx + 1}. Application ID: ${app.id || 'N/A'}
   Status: ${app.status || 'Unknown'}
   Requested Amount: ${app.requestedAmount ? `KES ${Number(app.requestedAmount).toLocaleString()}` : 'N/A'}`
).join('\n')}\n`;
    } else {
      prompt += `\n\nUSER'S LOAN APPLICATIONS: No applications found in the system.\n`;
    }

    if (systemData.products && systemData.products.length > 0) {
      prompt += `\n\nAVAILABLE LOAN PRODUCTS (Use this when users ask about products):
${systemData.products.slice(0, 5).map((product: any, idx: number) => 
  `${idx + 1}. ${product.productName || product.productCode || 'Product'}
   Code: ${product.productCode || 'N/A'}
   Interest Rate: ${product.rateOfInterest ? `${product.rateOfInterest}%` : 'N/A'}`
).join('\n')}\n`;
    }

    prompt += `\n\nCurrent conversation context: ${context}
Remember: Always provide clear, specific answers using the data above. Format numbers with commas and currency symbols.`;

    return prompt;
  }

  /**
   * Parse AI response and extract structured data
   */
  private parseAIResponse(
    aiResponse: string,
    systemData: Record<string, any>,
  ): {
    message: string;
    type: MessageType;
    quickReplies?: string[];
    systemData?: Record<string, any>;
  } {
    // Extract quick replies if present (marked with [QUICK_REPLY: ...])
    const quickReplyRegex = /\[QUICK_REPLY:\s*(.+?)\]/g;
    const quickReplies: string[] = [];
    let match;
    while ((match = quickReplyRegex.exec(aiResponse)) !== null) {
      quickReplies.push(match[1].trim());
    }

    // Remove quick reply markers from message
    let message = aiResponse.replace(/\[QUICK_REPLY:.*?\]/g, '').trim();

    // Clean up and format the message for clarity
    message = this.formatMessageForClarity(message);

    return {
      message,
      type: quickReplies.length > 0 ? MessageType.QUICK_REPLY : MessageType.TEXT,
      quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
      systemData,
    };
  }

  /**
   * Format message for clarity - clean up and improve readability
   */
  private formatMessageForClarity(message: string): string {
    // Remove excessive whitespace
    message = message.replace(/\s+/g, ' ').trim();
    
    // Ensure proper sentence spacing
    message = message.replace(/\.([A-Z])/g, '. $1');
    
    // Format numbers with commas (for amounts)
    message = message.replace(/(\d{4,})/g, (match) => {
      return Number(match).toLocaleString();
    });
    
    // Ensure currency formatting
    message = message.replace(/(KES|KSh|Ksh)\s*(\d+)/gi, (match, currency, amount) => {
      return `${currency} ${Number(amount).toLocaleString()}`;
    });
    
    // Remove redundant phrases
    message = message.replace(/\b(I apologize, but I could not generate a response|I'm sorry, I don't understand)\b/gi, '');
    
    // Capitalize first letter
    if (message.length > 0) {
      message = message.charAt(0).toUpperCase() + message.slice(1);
    }
    
    // Ensure message ends with punctuation
    if (message.length > 0 && !message.match(/[.!?]$/)) {
      message += '.';
    }
    
    return message.trim();
  }

  /**
   * Generate response using Google Gemini API
   */
  private async generateGeminiResponse(
    messages: Array<{ role: string; content: string }>,
    systemData: Record<string, any>,
  ): Promise<{
    message: string;
    type: MessageType;
    quickReplies?: string[];
    metadata?: Record<string, any>;
    confidence?: number;
    systemData?: Record<string, any>;
  }> {
    try {
      // Convert messages to Gemini format
      // Gemini uses a different format - we need to combine system message with first user message
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');
      
      // Build contents array for Gemini
      const contents: any[] = [];
      
      // Add system instruction as first user message if present
      if (systemMessage) {
        contents.push({
          role: 'user',
          parts: [{ text: systemMessage.content }],
        });
        contents.push({
          role: 'model',
          parts: [{ text: 'I understand. I will assist users with their lending needs based on the provided information.' }],
        });
      }
      
      // Add conversation messages
      for (const msg of conversationMessages) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents,
          generationConfig: {
            temperature: 0.6, // Lower temperature for more focused, clear responses
            maxOutputTokens: 800, // Increased for more detailed responses
            topP: 0.9,
            topK: 40,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 
                        'I apologize, but I could not generate a response.';
      
      const tokensUsed = response.data.usageMetadata?.totalTokenCount;

      // Extract quick replies and structured data from response
      const parsed = this.parseAIResponse(aiResponse, systemData);

      return {
        message: parsed.message,
        type: parsed.type || MessageType.TEXT,
        quickReplies: parsed.quickReplies,
        metadata: {
          tokensUsed,
          model: 'gemini-pro',
          aiGenerated: true,
          provider: 'gemini',
        },
        confidence: 0.85,
        systemData: parsed.systemData || systemData,
      };
    } catch (error: any) {
      this.logger.error(`Gemini API error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate response using OpenAI API
   */
  private async generateOpenAIResponse(
    messages: Array<{ role: string; content: string }>,
    systemData: Record<string, any>,
  ): Promise<{
    message: string;
    type: MessageType;
    quickReplies?: string[];
    metadata?: Record<string, any>;
    confidence?: number;
    systemData?: Record<string, any>;
  }> {
      const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages,
        temperature: 0.6, // Lower temperature for more focused, clear responses
        max_tokens: 800, // Increased for more detailed responses
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
      },
    );

    const aiResponse = response.data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    const tokensUsed = response.data.usage?.total_tokens;

    // Extract quick replies and structured data from response
    const parsed = this.parseAIResponse(aiResponse, systemData);

    return {
      message: parsed.message,
      type: parsed.type || MessageType.TEXT,
      quickReplies: parsed.quickReplies,
      metadata: {
        tokensUsed,
        model: 'gpt-4',
        aiGenerated: true,
        provider: 'openai',
      },
      confidence: 0.85,
      systemData: parsed.systemData || systemData,
    };
  }

  /**
   * Generate fallback response when AI is not available
   */
  private generateFallbackResponse(
    userMessage: string,
    systemData: Record<string, any>,
  ): {
    message: string;
    type: MessageType;
    quickReplies?: string[];
    metadata?: Record<string, any>;
    confidence?: number;
    systemData?: Record<string, any>;
  } {
    const lowerMessage = userMessage.toLowerCase();

    // Loan status queries
    if (lowerMessage.includes('loan') && (lowerMessage.includes('status') || lowerMessage.includes('balance'))) {
      if (systemData.loans && systemData.loans.length > 0) {
        const loan = systemData.loans[0];
        const balance = loan.outstandingBalance ? `KES ${Number(loan.outstandingBalance).toLocaleString()}` : 'N/A';
        const amount = loan.loanAmount ? `KES ${Number(loan.loanAmount).toLocaleString()}` : 'N/A';
        
        return {
          message: `Here's your loan information:\n\n📋 Loan Number: ${loan.loanNumber || 'N/A'}\n📊 Status: ${loan.status || 'Unknown'}\n💰 Loan Amount: ${amount}\n💵 Outstanding Balance: ${balance}\n\nWould you like more details about this loan?`,
          type: MessageType.TEXT,
          quickReplies: ['View loan details', 'Payment history', 'Make a payment', 'View all loans'],
          metadata: { ruleBased: true },
          confidence: 0.9,
          systemData,
        };
      } else {
        return {
          message: `I don't see any active loans in your account at the moment.\n\nYou can:\n• Apply for a new loan\n• View available loan products\n• Check your eligibility\n\nHow would you like to proceed?`,
          type: MessageType.TEXT,
          quickReplies: ['Apply for loan', 'View products', 'Check eligibility', 'Learn more'],
          metadata: { ruleBased: true },
          confidence: 0.8,
          systemData,
        };
      }
    }

    // Application status queries
    if (lowerMessage.includes('application') && lowerMessage.includes('status')) {
      if (systemData.applications && systemData.applications.length > 0) {
        const app = systemData.applications[0];
        const amount = app.requestedAmount ? `KES ${Number(app.requestedAmount).toLocaleString()}` : 'N/A';
        
        return {
          message: `Here's your loan application status:\n\n📝 Application Status: ${app.status || 'Unknown'}\n💰 Requested Amount: ${amount}\n\nYour application is being processed. Would you like more information?`,
          type: MessageType.TEXT,
          quickReplies: ['View application details', 'Check status updates', 'Contact support', 'View all applications'],
          metadata: { ruleBased: true },
          confidence: 0.9,
          systemData,
        };
      } else {
        return {
          message: `I don't see any active loan applications in your account.\n\nYou can:\n• Start a new loan application\n• View available loan products\n• Get personalized recommendations\n\nWhat would you like to do?`,
          type: MessageType.TEXT,
          quickReplies: ['Start application', 'View products', 'Get recommendations', 'Check eligibility'],
          metadata: { ruleBased: true },
          confidence: 0.8,
          systemData,
        };
      }
    }

    // Product/recommendation queries
    if (lowerMessage.includes('product') || lowerMessage.includes('recommend') || lowerMessage.includes('eligibility')) {
      if (systemData.products && systemData.products.length > 0) {
        const productList = systemData.products.slice(0, 3).map((p: any, idx: number) => 
          `${idx + 1}. ${p.productName || p.productCode} (${p.rateOfInterest ? `${p.rateOfInterest}%` : 'Rate varies'})`
        ).join('\n');
        
        return {
          message: `We have ${systemData.products.length} loan products available. Here are some options:\n\n${productList}\n\nI can help you find the best product for your needs. What type of loan are you looking for?`,
          type: MessageType.TEXT,
          quickReplies: ['Personal loan', 'Business loan', 'Trip financing', 'View all products'],
          metadata: { ruleBased: true },
          confidence: 0.85,
          systemData,
        };
      } else {
        return {
          message: `I can help you find the right loan product for your needs.\n\nWe offer:\n• Personal loans\n• Business loans\n• Trip financing\n• Custom loan solutions\n\nWhat type of loan are you interested in?`,
          type: MessageType.TEXT,
          quickReplies: ['Personal loan', 'Business loan', 'Trip financing', 'Learn more'],
          metadata: { ruleBased: true },
          confidence: 0.8,
          systemData,
        };
      }
    }

    // Greeting
    if (lowerMessage.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i)) {
      return {
        message: `Hello! 👋 I'm your AI assistant for Uruti Lending Platform.\n\nI can help you with:\n• Checking your loan status\n• Viewing loan applications\n• Finding loan products\n• Answering questions about repayments\n• Account management\n\nHow can I assist you today?`,
        type: MessageType.TEXT,
        quickReplies: ['Check loan status', 'View applications', 'Apply for loan', 'Product information'],
        metadata: { ruleBased: true },
        confidence: 0.9,
        systemData,
      };
    }

    // Default response - be more helpful
    return {
      message: `I understand you're asking about: "${userMessage}"\n\nI can help you with:\n• Loan inquiries and status checks\n• Application status and updates\n• Repayment information and schedules\n• Loan product information and recommendations\n• Account management\n\nWhat specific information would you like?`,
      type: MessageType.TEXT,
      quickReplies: ['Loan status', 'Application status', 'Product info', 'Contact support'],
      metadata: { ruleBased: true },
      confidence: 0.7,
      systemData,
    };
  }

  /**
   * Generate session ID for anonymous users
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

