import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AIDocumentProcessorService } from './services/ai-document-processor.service';
import { AIApplicationFillerService } from './services/ai-application-filler.service';
import { AIProductRecommendationService } from './services/ai-product-recommendation.service';
import { AIEligibilityAssessmentService } from './services/ai-eligibility-assessment.service';
import { ChatbotService } from './services/chatbot.service';
import { ProcessDocumentDto, DocumentProcessingResultDto } from './dto/document-processing.dto';
import { RecommendProductsDto, ProductRecommendationResponseDto, CustomerProfileDto } from './dto/product-recommendation.dto';
import { SendMessageDto, ChatbotResponseDto, GetConversationDto, UpdateConversationDto } from './dto/chatbot.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AIController {
  constructor(
    private readonly aiDocumentProcessorService: AIDocumentProcessorService,
    private readonly aiApplicationFillerService: AIApplicationFillerService,
    private readonly aiProductRecommendationService: AIProductRecommendationService,
    private readonly aiEligibilityAssessmentService: AIEligibilityAssessmentService,
    private readonly chatbotService: ChatbotService,
  ) {}

  @Post('documents/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process document with AI and verification',
    description: `
Extracts text and structured data from uploaded documents using AI/OCR with comprehensive verification checks.

## Features:
- **50+ Document Types**: Supports identity, financial, address, employment, business, and educational documents
- **Authenticity Checks**: Detects forgeries and alterations (metadata, format, ID validation, date consistency, image manipulation)
- **OCR Accuracy**: Tracks accuracy (98%+ for typed, 90%+ for handwritten) with handwriting detection
- **Cross-field Validation**: Verifies name, ID, and photo consistency across document fields
- **Quality Flags**: Detects blurry, partial, or tampered images
- **Response Time**: Guaranteed completion within 10 seconds (timeout enforced)

## Document Types Supported:
- **Identity (10)**: ID_CARD, PASSPORT, DRIVERS_LICENSE, PAN_CARD, AADHAAR, VOTERS_ID, BIRTH_CERTIFICATE, MARRIAGE_CERTIFICATE, SOCIAL_SECURITY_CARD, RESIDENCE_PERMIT
- **Financial (15)**: BANK_STATEMENT, PAYSLIP, TAX_RETURN, TAX_FORM_16, TAX_FORM_1040, TAX_W2, TAX_1099, INCOME_STATEMENT, BALANCE_SHEET, PROFIT_LOSS_STATEMENT, BANK_LETTER, CREDIT_REPORT, INVESTMENT_STATEMENT, RETIREMENT_STATEMENT, DIVIDEND_STATEMENT
- **Address Proof (8)**: UTILITY_BILL, ELECTRICITY_BILL, WATER_BILL, GAS_BILL, PHONE_BILL, INTERNET_BILL, RENTAL_AGREEMENT, PROPERTY_DEED
- **Employment (7)**: EMPLOYMENT_LETTER, OFFER_LETTER, APPOINTMENT_LETTER, CONTRACT, SALARY_CERTIFICATE, EXPERIENCE_CERTIFICATE, REFERENCE_LETTER
- **Business (6)**: BUSINESS_LICENSE, REGISTRATION_CERTIFICATE, GST_CERTIFICATE, VAT_CERTIFICATE, PARTNERSHIP_DEED, ARTICLES_OF_INCORPORATION
- **Educational (4)**: DEGREE_CERTIFICATE, DIPLOMA, TRANSCRIPT, EDUCATIONAL_CERTIFICATE
    `.trim(),
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Document processed successfully with verification results',
    type: DocumentProcessingResultDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid document, processing failed, or timeout exceeded (10 seconds)' 
  })
  async processDocument(
    @Body() dto: ProcessDocumentDto,
    @Request() req: any,
  ): Promise<DocumentProcessingResultDto> {
    return this.aiDocumentProcessorService.processDocument(dto, req.user?.id);
  }

  @Post('documents/:documentId/process-and-fill/:applicationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process document and auto-fill loan application',
    description: 'Extracts data from document and automatically fills loan application fields',
  })
  @ApiResponse({ status: 200, description: 'Document processed and application filled successfully' })
  async processAndFillApplication(
    @Param('documentId') documentId: string,
    @Param('applicationId') applicationId: string,
    @Body() body: { documentType: string; fileUrl?: string; filePath?: string; mimeType?: string },
  ) {
    return this.aiApplicationFillerService.processDocumentAndFillApplication(
      documentId,
      applicationId,
      body.documentType,
      body.fileUrl,
      body.filePath,
      body.mimeType,
    );
  }

  @Post('products/recommend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get AI-powered product recommendations',
    description: 'Recommends the best loan products for a customer based on their profile and needs',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Product recommendations retrieved successfully',
    type: [ProductRecommendationResponseDto],
  })
  async recommendProducts(
    @Body() dto: RecommendProductsDto,
  ): Promise<ProductRecommendationResponseDto[]> {
    const recommendations = await this.aiProductRecommendationService.recommendProducts({
      customerProfile: dto.customerProfile,
      companyId: dto.companyId,
      limit: dto.limit,
      includeNotEligible: dto.includeNotEligible,
    });

    // Map to response DTO
    return recommendations.map(rec => ({
      productId: rec.product.id,
      productCode: rec.product.productCode,
      productName: rec.product.productName,
      matchScore: rec.matchScore,
      reasons: rec.reasons,
      estimatedApproval: rec.estimatedApproval,
      estimatedAmount: rec.estimatedAmount,
      estimatedRate: rec.estimatedRate,
      estimatedMonthlyPayment: rec.estimatedMonthlyPayment,
      eligibilityStatus: rec.eligibilityStatus,
      missingRequirements: rec.missingRequirements,
      loanCategory: rec.product.loanCategory,
      productType: rec.product.productType,
      rateOfInterest: rec.product.rateOfInterest,
      minimumLoanAmount: rec.product.minimumLoanAmount,
      maximumLoanAmount: rec.product.maximumLoanAmount,
      minimumTerm: rec.product.minimumTerm,
      maximumTerm: rec.product.maximumTerm,
    }));
  }

  @Post('products/:productId/check-eligibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check customer eligibility for a specific product',
    description: 'Assesses if a customer meets the eligibility criteria for a loan product',
  })
  @ApiResponse({ status: 200, description: 'Eligibility check completed successfully' })
  async checkEligibility(
    @Param('productId') productId: string,
    @Body() body: { customerProfile: CustomerProfileDto },
  ) {
    return this.aiEligibilityAssessmentService.checkEligibility({
      productId,
      customerProfile: body.customerProfile,
    });
  }

  @Post('products/code/:productCode/check-eligibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check customer eligibility for a product by code',
    description: 'Assesses if a customer meets the eligibility criteria for a loan product (by product code)',
  })
  @ApiResponse({ status: 200, description: 'Eligibility check completed successfully' })
  async checkEligibilityByCode(
    @Param('productCode') productCode: string,
    @Body() body: { customerProfile: CustomerProfileDto },
  ) {
    return this.aiEligibilityAssessmentService.checkEligibilityByCode(
      productCode,
      body.customerProfile,
    );
  }

  // Chatbot Endpoints
  @Post('chatbot/message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send message to chatbot',
    description: 'Sends a message to the AI chatbot and receives a response. Can continue existing conversation or start new one.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chatbot response generated successfully',
    type: ChatbotResponseDto,
  })
  async sendChatbotMessage(
    @Body() dto: SendMessageDto,
    @Request() req: any,
  ): Promise<ChatbotResponseDto> {
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || null;
    return this.chatbotService.sendMessage(userId, sessionId, dto);
  }

  @Get('chatbot/conversations')
  @ApiOperation({
    summary: 'Get user conversations',
    description: 'Retrieves all conversations for the authenticated user or session',
  })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  async getUserConversations(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || null;
    return this.chatbotService.getUserConversations(userId, sessionId, limit ? parseInt(limit) : 20);
  }

  @Get('chatbot/conversations/:conversationId')
  @ApiOperation({
    summary: 'Get conversation details',
    description: 'Retrieves a specific conversation with all messages',
  })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  async getConversation(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return this.chatbotService.getConversation(conversationId, userId);
  }

  @Post('chatbot/conversations/:conversationId/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive conversation',
    description: 'Archives a conversation',
  })
  @ApiResponse({ status: 200, description: 'Conversation archived successfully' })
  async archiveConversation(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    await this.chatbotService.archiveConversation(conversationId, userId);
    return { message: 'Conversation archived successfully' };
  }
}

