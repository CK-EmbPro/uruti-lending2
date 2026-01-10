import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerPortalEnhancedService } from './services/customer-portal-enhanced.service';
import {
  AddPaymentMethodDto,
  SetupAutoPayDto,
  SubmitLoanApplicationDto,
  UploadDocumentDto,
  UpdateCommunicationPreferencesDto,
  FinancialGoalDto,
} from './dto/customer-portal-enhanced.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Customer Portal Enhanced')
@ApiBearerAuth()
@Controller('customer-portal-enhanced')
export class CustomerPortalEnhancedController {
  constructor(private readonly enhancedService: CustomerPortalEnhancedService) {}

  // Payment Methods
  @Post('payment-methods')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add payment method' })
  @ApiResponse({ status: 201, description: 'Payment method added successfully' })
  addPaymentMethod(@Request() req: any, @Body() addDto: AddPaymentMethodDto) {
    return this.enhancedService.addPaymentMethod(req.user.customerId || req.user.id, addDto);
  }

  @Get('payment-methods')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment methods' })
  @ApiResponse({ status: 200, description: 'List of payment methods' })
  getPaymentMethods(@Request() req: any) {
    return this.enhancedService.getPaymentMethods(req.user.customerId || req.user.id);
  }

  @Patch('payment-methods/:id/default')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Set default payment method' })
  @ApiResponse({ status: 200, description: 'Default payment method updated' })
  setDefaultPaymentMethod(@Request() req: any, @Param('id') id: string) {
    return this.enhancedService.setDefaultPaymentMethod(req.user.customerId || req.user.id, id);
  }

  @Delete('payment-methods/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove payment method' })
  @ApiResponse({ status: 200, description: 'Payment method removed' })
  removePaymentMethod(@Request() req: any, @Param('id') id: string) {
    return this.enhancedService.removePaymentMethod(req.user.customerId || req.user.id, id);
  }

  // Auto-Pay
  @Post('auto-pay')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Setup auto-pay' })
  @ApiResponse({ status: 201, description: 'Auto-pay setup successfully' })
  setupAutoPay(@Request() req: any, @Body() setupDto: SetupAutoPayDto) {
    return this.enhancedService.setupAutoPay(req.user.customerId || req.user.id, setupDto);
  }

  @Get('auto-pay')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get auto-pay configurations' })
  @ApiResponse({ status: 200, description: 'List of auto-pay configurations' })
  getAutoPayConfigurations(@Request() req: any) {
    return this.enhancedService.getAutoPayConfigurations(req.user.customerId || req.user.id);
  }

  @Delete('auto-pay/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel auto-pay' })
  @ApiResponse({ status: 200, description: 'Auto-pay cancelled' })
  cancelAutoPay(@Request() req: any, @Param('id') id: string) {
    return this.enhancedService.cancelAutoPay(req.user.customerId || req.user.id, id);
  }

  // Loan Applications
  @Post('loan-applications')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit loan application' })
  @ApiResponse({ status: 201, description: 'Loan application submitted successfully' })
  submitLoanApplication(@Request() req: any, @Body() submitDto: SubmitLoanApplicationDto) {
    const companyId = req.user?.companyId || req.companyId;
    return this.enhancedService.submitLoanApplication(req.user.customerId || req.user.id, submitDto, companyId);
  }

  @Get('loan-applications')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get loan applications' })
  @ApiResponse({ status: 200, description: 'List of loan applications' })
  getLoanApplications(@Request() req: any) {
    return this.enhancedService.getLoanApplications(req.user.customerId || req.user.id);
  }

  // Documents
  @Post('documents')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload document' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  uploadDocument(@Request() req: any, @Body() uploadDto: UploadDocumentDto) {
    return this.enhancedService.uploadDocument(req.user.customerId || req.user.id, uploadDto);
  }

  @Get('documents')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get documents' })
  @ApiResponse({ status: 200, description: 'List of documents' })
  getDocuments(@Request() req: any, @Param('loanApplicationId') loanApplicationId?: string) {
    return this.enhancedService.getDocuments(req.user.customerId || req.user.id, loanApplicationId);
  }

  @Delete('documents/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  deleteDocument(@Request() req: any, @Param('id') id: string) {
    return this.enhancedService.deleteDocument(req.user.customerId || req.user.id, id);
  }

  // Communication Preferences
  @Get('communication-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get communication preferences' })
  @ApiResponse({ status: 200, description: 'Communication preferences' })
  getCommunicationPreferences(@Request() req: any) {
    return this.enhancedService.getCommunicationPreferences(req.user.customerId || req.user.id);
  }

  @Patch('communication-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update communication preferences' })
  @ApiResponse({ status: 200, description: 'Communication preferences updated' })
  updateCommunicationPreferences(
    @Request() req: any,
    @Body() updateDto: UpdateCommunicationPreferencesDto,
  ) {
    return this.enhancedService.updateCommunicationPreferences(
      req.user.customerId || req.user.id,
      updateDto,
    );
  }

  // Financial Goals
  @Post('financial-goals')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create financial goal' })
  @ApiResponse({ status: 201, description: 'Financial goal created successfully' })
  createFinancialGoal(@Request() req: any, @Body() goalDto: FinancialGoalDto) {
    return this.enhancedService.createFinancialGoal(req.user.customerId || req.user.id, goalDto);
  }

  @Get('financial-goals')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get financial goals' })
  @ApiResponse({ status: 200, description: 'List of financial goals' })
  getFinancialGoals(@Request() req: any) {
    return this.enhancedService.getFinancialGoals(req.user.customerId || req.user.id);
  }

  @Patch('financial-goals/:id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update financial goal progress' })
  @ApiResponse({ status: 200, description: 'Financial goal progress updated' })
  updateFinancialGoalProgress(
    @Request() req: any,
    @Param('id') id: string,
    @Body('progress') progress: number,
  ) {
    return this.enhancedService.updateFinancialGoalProgress(
      req.user.customerId || req.user.id,
      id,
      progress,
    );
  }
}

