import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountInquiryService } from './services/account-inquiry.service';
import { StatementService } from './services/statement.service';
import { LoanModificationService } from './services/loan-modification.service';
import { RefinancingService } from './services/refinancing.service';
import { PayoffQuoteService } from './services/payoff-quote.service';
import { EarlySettlementRebateService } from './services/early-settlement-rebate.service';
import { EarlySettlementDailyCalculationService } from './services/early-settlement-daily-calculation.service';
import { EarlySettlementAnalyticsService } from './services/early-settlement-analytics.service';
import { CreateStatementDto } from './dto/loan-statement.dto';
import {
  CreateLoanModificationDto,
  ReviewModificationDto,
  ExecuteModificationDto,
} from './dto/loan-modification.dto';
import {
  CreateRefinancingApplicationDto,
  CheckEligibilityDto,
  OfferRefinancingDto,
} from './dto/refinancing.dto';
import { CreatePayoffQuoteDto, ProcessPayoffDto } from './dto/payoff-quote.dto';
import {
  CalculateDailyPayoffDto,
  CalculateDailyPayoffsRangeDto,
  GetAnalyticsDto,
  GenerateAnalyticsDto,
} from './dto/early-settlement.dto';

@ApiTags('Account Management')
@ApiBearerAuth('JWT-auth')
@Controller('account-management')
export class AccountManagementController {
  constructor(
    private readonly inquiryService: AccountInquiryService,
    private readonly statementService: StatementService,
    private readonly modificationService: LoanModificationService,
    private readonly refinancingService: RefinancingService,
    private readonly payoffQuoteService: PayoffQuoteService,
    private readonly rebateService: EarlySettlementRebateService,
    private readonly dailyCalculationService: EarlySettlementDailyCalculationService,
    private readonly analyticsService: EarlySettlementAnalyticsService,
  ) {}

  // UC-019: Account Information Inquiry
  @Get('loans/:loanId/summary')
  @ApiOperation({ summary: 'Get account summary (UC-019)' })
  @ApiResponse({ status: 200, description: 'Summary retrieved' })
  async getAccountSummary(@Param('loanId') loanId: string) {
    return await this.inquiryService.getAccountSummary(loanId);
  }

  @Get('loans/:loanId/payment-history')
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved' })
  async getPaymentHistory(@Param('loanId') loanId: string, @Query('limit') limit?: number) {
    return await this.inquiryService.getPaymentHistory(loanId, limit ? parseInt(limit.toString()) : 50);
  }

  @Get('loans/:loanId/upcoming-payments')
  @ApiOperation({ summary: 'Get upcoming payments' })
  @ApiResponse({ status: 200, description: 'Upcoming payments retrieved' })
  async getUpcomingPayments(@Param('loanId') loanId: string, @Query('limit') limit?: number) {
    return await this.inquiryService.getUpcomingPayments(loanId, limit ? parseInt(limit.toString()) : 12);
  }

  @Get('loans/:loanId/details')
  @ApiOperation({ summary: 'Get complete account details' })
  @ApiResponse({ status: 200, description: 'Account details retrieved' })
  async getAccountDetails(@Param('loanId') loanId: string) {
    return await this.inquiryService.getAccountDetails(loanId);
  }

  // UC-020: Statement Generation
  @Post('statements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate statement (UC-020)' })
  @ApiResponse({ status: 201, description: 'Statement generated' })
  async generateStatement(@Body() createDto: CreateStatementDto) {
    return await this.statementService.generateStatement(createDto);
  }

  @Post('statements/:statementId/send')
  @ApiOperation({ summary: 'Send statement' })
  @ApiResponse({ status: 200, description: 'Statement sent' })
  async sendStatement(@Param('statementId') statementId: string) {
    return await this.statementService.sendStatement(statementId);
  }

  @Get('loans/:loanId/statements')
  @ApiOperation({ summary: 'Get statements for loan' })
  @ApiResponse({ status: 200, description: 'Statements retrieved' })
  async getStatementsForLoan(@Param('loanId') loanId: string) {
    return await this.statementService.getStatementsForLoan(loanId);
  }

  // UC-021: Loan Modification Request
  @Post('modifications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create modification request (UC-021)' })
  @ApiResponse({ status: 201, description: 'Request created' })
  async createModification(@Body() createDto: CreateLoanModificationDto, @Request() req: any) {
    return await this.modificationService.createModificationRequest(createDto, req.user.id);
  }

  @Post('modifications/:modificationId/review')
  @ApiOperation({ summary: 'Review modification request' })
  @ApiResponse({ status: 200, description: 'Request reviewed' })
  async reviewModification(
    @Param('modificationId') modificationId: string,
    @Body() reviewDto: ReviewModificationDto,
    @Request() req: any,
  ) {
    return await this.modificationService.reviewModification(modificationId, reviewDto, req.user.id);
  }

  @Post('modifications/:modificationId/approve')
  @ApiOperation({ summary: 'Approve modification' })
  @ApiResponse({ status: 200, description: 'Modification approved' })
  async approveModification(@Param('modificationId') modificationId: string, @Request() req: any) {
    return await this.modificationService.approveModification(modificationId, req.user.id);
  }

  @Post('modifications/:modificationId/execute')
  @ApiOperation({ summary: 'Execute modification' })
  @ApiResponse({ status: 200, description: 'Modification executed' })
  async executeModification(
    @Param('modificationId') modificationId: string,
    @Body() executeDto: ExecuteModificationDto,
  ) {
    return await this.modificationService.executeModification(modificationId, executeDto);
  }

  @Get('loans/:loanId/modifications')
  @ApiOperation({ summary: 'Get modifications for loan' })
  @ApiResponse({ status: 200, description: 'Modifications retrieved' })
  async getModificationsForLoan(@Param('loanId') loanId: string) {
    return await this.modificationService.getModificationsForLoan(loanId);
  }

  // UC-022: Refinancing Application
  @Post('refinancing')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create refinancing application (UC-022)' })
  @ApiResponse({ status: 201, description: 'Application created' })
  async createRefinancing(@Body() createDto: CreateRefinancingApplicationDto, @Request() req: any) {
    return await this.refinancingService.createApplication(createDto, req.user.id);
  }

  @Post('refinancing/:applicationId/check-eligibility')
  @ApiOperation({ summary: 'Check eligibility' })
  @ApiResponse({ status: 200, description: 'Eligibility checked' })
  async checkEligibility(
    @Param('applicationId') applicationId: string,
    @Body() eligibilityDto: CheckEligibilityDto,
  ) {
    return await this.refinancingService.checkEligibility(applicationId, eligibilityDto);
  }

  @Post('refinancing/:applicationId/credit-check')
  @ApiOperation({ summary: 'Perform credit check' })
  @ApiResponse({ status: 200, description: 'Credit check completed' })
  async performCreditCheck(@Param('applicationId') applicationId: string) {
    return await this.refinancingService.performCreditCheck(applicationId);
  }

  @Post('refinancing/:applicationId/offer')
  @ApiOperation({ summary: 'Offer refinancing terms' })
  @ApiResponse({ status: 200, description: 'Offer made' })
  async offerRefinancing(
    @Param('applicationId') applicationId: string,
    @Body() offerDto: OfferRefinancingDto,
  ) {
    return await this.refinancingService.offerRefinancing(applicationId, offerDto);
  }

  @Post('refinancing/:applicationId/accept')
  @ApiOperation({ summary: 'Accept refinancing offer' })
  @ApiResponse({ status: 200, description: 'Offer accepted' })
  async acceptOffer(@Param('applicationId') applicationId: string) {
    return await this.refinancingService.acceptOffer(applicationId);
  }

  @Get('loans/:loanId/refinancing')
  @ApiOperation({ summary: 'Get refinancing applications for loan' })
  @ApiResponse({ status: 200, description: 'Applications retrieved' })
  async getRefinancingForLoan(@Param('loanId') loanId: string) {
    return await this.refinancingService.getApplicationsForLoan(loanId);
  }

  // UC-023: Payoff Quote Request
  @Post('payoff-quotes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate payoff quote (UC-023)' })
  @ApiResponse({ status: 201, description: 'Quote generated' })
  async generateQuote(@Body() createDto: CreatePayoffQuoteDto) {
    return await this.payoffQuoteService.generateQuote(createDto);
  }

  @Post('payoff-quotes/:quoteId/process')
  @ApiOperation({ summary: 'Process payoff' })
  @ApiResponse({ status: 200, description: 'Payoff processed' })
  async processPayoff(@Body() payoffDto: ProcessPayoffDto, @Request() req: any) {
    return await this.payoffQuoteService.processPayoff(payoffDto, req.user.id);
  }

  @Get('loans/:loanId/payoff-quotes')
  @ApiOperation({ summary: 'Get payoff quotes for loan' })
  @ApiResponse({ status: 200, description: 'Quotes retrieved' })
  async getQuotesForLoan(@Param('loanId') loanId: string) {
    return await this.payoffQuoteService.getQuotesForLoan(loanId);
  }

  @Get('loans/:loanId/payoff-quotes/active')
  @ApiOperation({ summary: 'Get active payoff quote' })
  @ApiResponse({ status: 200, description: 'Active quote retrieved' })
  async getActiveQuote(@Param('loanId') loanId: string) {
    return await this.payoffQuoteService.getActiveQuote(loanId);
  }

  // Early Settlement Incentives - Daily Calculation
  @Post('early-settlement/daily-payoff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate daily payoff amount with rebate' })
  @ApiResponse({ status: 200, description: 'Daily payoff calculated' })
  async calculateDailyPayoff(@Body() dto: CalculateDailyPayoffDto) {
    const calculationDate = dto.calculationDate ? new Date(dto.calculationDate) : new Date();
    return await this.dailyCalculationService.calculatePayoffForDate(dto.loanId, calculationDate);
  }

  @Post('early-settlement/daily-payoffs-range')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate daily payoff amounts for date range' })
  @ApiResponse({ status: 200, description: 'Daily payoffs calculated' })
  async calculateDailyPayoffsRange(@Body() dto: CalculateDailyPayoffsRangeDto) {
    return await this.dailyCalculationService.calculateDailyPayoffsForRange(
      dto.loanId,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );
  }

  @Get('loans/:loanId/early-settlement/daily-calculations')
  @ApiOperation({ summary: 'Get daily payoff calculations for loan' })
  @ApiResponse({ status: 200, description: 'Daily calculations retrieved' })
  async getDailyCalculations(
    @Param('loanId') loanId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.dailyCalculationService.getDailyCalculations(
      loanId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('loans/:loanId/early-settlement/latest-calculation')
  @ApiOperation({ summary: 'Get latest daily payoff calculation' })
  @ApiResponse({ status: 200, description: 'Latest calculation retrieved' })
  async getLatestCalculation(@Param('loanId') loanId: string) {
    return await this.dailyCalculationService.getLatestCalculation(loanId);
  }

  // Early Settlement Incentives - Analytics
  @Post('early-settlement/analytics/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate early settlement analytics by segment' })
  @ApiResponse({ status: 200, description: 'Analytics generated' })
  async generateAnalytics(@Body() dto: GenerateAnalyticsDto, @Request() req: any) {
    return await this.analyticsService.generateAnalytics(
      req.user.companyId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
    );
  }

  @Get('early-settlement/analytics')
  @ApiOperation({ summary: 'Get early settlement analytics by segment' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  async getAnalytics(@Query() query: GetAnalyticsDto, @Request() req: any) {
    return await this.analyticsService.getAnalyticsBySegment(
      req.user.companyId,
      query.segment,
      query.periodStart ? new Date(query.periodStart) : undefined,
      query.periodEnd ? new Date(query.periodEnd) : undefined,
    );
  }

  // Early Settlement Incentives - Rebate Formula
  @Get('early-settlement/rebate-formula')
  @ApiOperation({ summary: 'Get rebate formula description' })
  @ApiResponse({ status: 200, description: 'Rebate formula retrieved' })
  async getRebateFormula() {
    return {
      formula: this.rebateService.getRebateFormulaDescription(),
      tiers: [
        { monthsRemaining: '>12', rebatePercentage: 50 },
        { monthsRemaining: '6-12', rebatePercentage: 30 },
        { monthsRemaining: '3-6', rebatePercentage: 15 },
        { monthsRemaining: '<3', rebatePercentage: 5 },
        { monthsRemaining: '0', rebatePercentage: 0 },
      ],
    };
  }
}













