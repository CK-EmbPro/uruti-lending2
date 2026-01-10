import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AIChatbotService } from './services/ai-chatbot.service';
import {
  ChatMessageDto,
  StaffQueryDto,
} from './dto/ai-chatbot.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('ai-chatbot')
@ApiBearerAuth('JWT-auth')
@Controller('ai-chatbot')
@UseGuards(CompanyGuard)
export class AIChatbotController {
  constructor(private readonly chatbotService: AIChatbotService) {}

  @Post('customer/chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle customer chat message',
    description: 'Processes customer chat messages and provides intelligent responses about loan applications, loan status, payments, and documents. Supports conversation context.',
  })
  @ApiBody({ type: ChatMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Chat response generated successfully',
  })
  async handleCustomerMessage(
    @Body() dto: ChatMessageDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const userId = req.user?.id || dto.context?.userId || 'anonymous';
    return await this.chatbotService.handleCustomerMessage(dto, userId, companyId);
  }

  @Post('staff/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle staff query',
    description: 'Processes staff queries using natural language understanding. Can query loans, applications, portfolio data, and perform data lookups.',
  })
  @ApiBody({ type: StaffQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Query processed successfully',
  })
  async handleStaffQuery(
    @Body() dto: StaffQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const userId = req.user?.id || 'system';
    return await this.chatbotService.handleStaffQuery(dto, userId, companyId);
  }

  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Get conversation history',
    description: 'Returns the full conversation history for a specific conversation ID.',
  })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation history retrieved successfully',
  })
  async getConversationHistory(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.chatbotService.getConversationHistory(id, companyId);
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'Get user conversations',
    description: 'Returns all conversations for the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
  })
  async getUserConversations(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    const userId = req.user?.id || 'anonymous';
    return await this.chatbotService.getUserConversations(userId, companyId);
  }
}

