import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReconciliationService } from './services/reconciliation.service';
import {
  LedgerEntryDto,
  PaymentMismatchDto,
  ReconciliationReportDto,
  CreateLedgerEntryRequestDto,
  ProcessPaymentRequestDto,
} from './dto/reconciliation.dto';

@ApiTags('Accounting & Reconciliation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/accounting')
export class AccountingController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('ledger-entry')
  @ApiOperation({ summary: 'Create a ledger entry (double-entry accounting)' })
  @ApiResponse({
    status: 200,
    description: 'Ledger entry created',
    type: LedgerEntryDto,
  })
  async createLedgerEntry(
    @Body() request: CreateLedgerEntryRequestDto,
    @Request() req: any,
  ): Promise<LedgerEntryDto> {
    const userId = req.user?.id || 'SYSTEM';
    return await this.reconciliationService.createLedgerEntry(request, userId);
  }

  @Post('process-payment')
  @ApiOperation({ summary: 'Process payment and detect mismatches' })
  @ApiResponse({
    status: 200,
    description: 'Payment processed',
    type: PaymentMismatchDto,
  })
  async processPayment(@Body() request: ProcessPaymentRequestDto): Promise<PaymentMismatchDto | null> {
    return await this.reconciliationService.processPayment(request);
  }

  @Get('payment-mismatches')
  @ApiOperation({ summary: 'Get payment mismatches in review queue' })
  @ApiResponse({
    status: 200,
    description: 'Payment mismatches',
    type: [PaymentMismatchDto],
  })
  async getPaymentMismatches(@Query('resolved') resolved?: string): Promise<PaymentMismatchDto[]> {
    const isResolved = resolved === 'true';
    return await this.reconciliationService.getPaymentMismatches(isResolved);
  }

  @Post('reconciliation/run')
  @ApiOperation({ summary: 'Run end-of-day reconciliation' })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation completed',
    type: ReconciliationReportDto,
  })
  async runReconciliation(@Body('date') date?: string): Promise<ReconciliationReportDto> {
    const reconciliationDate = date ? new Date(date) : new Date();
    return await this.reconciliationService.runEndOfDayReconciliation(reconciliationDate);
  }

  @Get('ledger-entries')
  @ApiOperation({ summary: 'Get ledger entries' })
  @ApiResponse({
    status: 200,
    description: 'Ledger entries',
    type: [LedgerEntryDto],
  })
  async getLedgerEntries(
    @Query('loanId') loanId?: string,
    @Query('customerId') customerId?: string,
    @Query('referenceNumber') referenceNumber?: string,
  ): Promise<LedgerEntryDto[]> {
    // Would implement filtering logic
    return [];
  }
}
