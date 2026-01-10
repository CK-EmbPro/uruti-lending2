import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RevenueBasedRepaymentConfigService } from './services/revenue-based-repayment-config.service';
import { RevenueTrackingService } from './services/revenue-tracking.service';
import { RevenueBasedRepaymentCalculatorService } from './services/revenue-based-repayment-calculator.service';
import { RevenueVerificationService } from './services/revenue-verification.service';
import {
  CreateRevenueBasedRepaymentConfigDto,
  RecordRevenueDto,
  CalculateRepaymentDto,
  VerifyRevenueDto,
} from './dto/revenue-based-repayment.dto';

@ApiTags('Revenue-Based Repayment')
@Controller('revenue-based-repayment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RevenueBasedRepaymentController {
  constructor(
    private readonly configService: RevenueBasedRepaymentConfigService,
    private readonly revenueTrackingService: RevenueTrackingService,
    private readonly calculatorService: RevenueBasedRepaymentCalculatorService,
    private readonly verificationService: RevenueVerificationService,
  ) {}

  @Post('config')
  @ApiOperation({
    summary: 'Create revenue-based repayment configuration',
    description: 'Creates configuration for revenue-based repayment including percentage, floor/ceiling, and integration settings',
  })
  @ApiResponse({ status: 201, description: 'Configuration created successfully' })
  async createConfig(
    @Body() dto: CreateRevenueBasedRepaymentConfigDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.configService.createConfig(dto, companyId);
  }

  @Get('config/loan/:loanId')
  @ApiOperation({
    summary: 'Get revenue-based repayment configuration for a loan',
    description: 'Retrieves the revenue-based repayment configuration for a specific loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  async getConfig(@Param('loanId') loanId: string) {
    return await this.configService.getConfigByLoanId(loanId);
  }

  @Post('revenue/record')
  @ApiOperation({
    summary: 'Record revenue for a loan',
    description: 'Records revenue data from payment gateway, accounting system, or manual entry',
  })
  @ApiResponse({ status: 201, description: 'Revenue recorded successfully' })
  async recordRevenue(
    @Body() dto: RecordRevenueDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.revenueTrackingService.recordRevenue(
      dto.loanId,
      companyId,
      {
        amount: dto.revenueAmount,
        date: new Date(dto.revenueDate),
        source: dto.source,
        integrationId: dto.integrationId,
        externalReferenceId: dto.externalReferenceId,
        description: dto.description,
      },
    );
  }

  @Post('revenue/fetch/:integrationId')
  @ApiOperation({
    summary: 'Fetch revenue from integration',
    description: 'Fetches revenue data from payment gateway or accounting system integration',
  })
  @ApiParam({ name: 'integrationId', description: 'Integration ID' })
  @ApiQuery({ name: 'loanId', required: true, description: 'Loan ID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Revenue fetched successfully' })
  async fetchRevenue(
    @Param('integrationId') integrationId: string,
    @Query('loanId') loanId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // Determine integration type and fetch accordingly
    // This would be enhanced to auto-detect integration type
    const revenueData = await this.revenueTrackingService.fetchRevenueFromPaymentGateway(
      integrationId,
      loanId,
      new Date(startDate),
      new Date(endDate),
    );

    // Record all revenue entries
    const companyId = ''; // Would come from request context
    const recorded = [];
    for (const data of revenueData) {
      const entry = await this.revenueTrackingService.recordRevenue(loanId, companyId, data);
      recorded.push(entry);
    }

    return { count: recorded.length, entries: recorded };
  }

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate revenue-based repayment',
    description: 'Calculates repayment amount based on revenue percentage with floor/ceiling enforcement',
  })
  @ApiResponse({ status: 200, description: 'Repayment calculated successfully' })
  async calculateRepayment(@Body() dto: CalculateRepaymentDto) {
    const config = await this.configService.getConfigByLoanId(dto.loanId);
    
    let periodStartDate: Date;
    let periodEndDate: Date;

    if (dto.periodStartDate && dto.periodEndDate) {
      periodStartDate = new Date(dto.periodStartDate);
      periodEndDate = new Date(dto.periodEndDate);
    } else {
      const period = this.calculatorService.getPeriodDates(
        config.revenuePeriod,
        new Date(),
      );
      periodStartDate = period.startDate;
      periodEndDate = period.endDate;
    }

    return await this.calculatorService.calculateRepayment(
      dto.loanId,
      periodStartDate,
      periodEndDate,
    );
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verify revenue against bank statements',
    description: 'Cross-checks reported revenue against bank statement transactions and flags discrepancies',
  })
  @ApiResponse({ status: 200, description: 'Verification completed' })
  async verifyRevenue(@Body() dto: VerifyRevenueDto) {
    return await this.verificationService.verifyRevenueAgainstBankStatements(
      dto.revenueTrackingId,
      dto.bankAccountId,
    );
  }

  @Get('verify/loan/:loanId')
  @ApiOperation({
    summary: 'Get verification history for a loan',
    description: 'Retrieves all revenue verification records for a loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({ status: 200, description: 'Verification history retrieved successfully' })
  async getVerificationHistory(@Param('loanId') loanId: string) {
    return await this.verificationService.getVerificationHistory(loanId);
  }

  @Get('verify/discrepancies/:loanId')
  @ApiOperation({
    summary: 'Get discrepancies for a loan',
    description: 'Retrieves all revenue verification discrepancies for a loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({ status: 200, description: 'Discrepancies retrieved successfully' })
  async getDiscrepancies(@Param('loanId') loanId: string) {
    return await this.verificationService.getDiscrepancies(loanId);
  }
}

