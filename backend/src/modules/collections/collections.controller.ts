import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CollectionsService } from './services/collections.service';
import { CollectionsIntegrationService } from './services/collections-integration.service';
import { CreatePaymentArrangementDto } from './dto/create-payment-arrangement.dto';
import { CreateCollectionActivityDto } from './dto/create-collection-activity.dto';
import { CreateSkipTraceDto } from './dto/create-skip-trace.dto';
import { CreateLegalActionDto } from './dto/create-legal-action.dto';
import { CreateThirdPartyPlacementDto } from './dto/create-third-party-placement.dto';
import { CreatePromiseToPayDto } from './dto/create-promise-to-pay.dto';
import { CollectionStage } from '../../common/enums/collection-stage.enum';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(
    private readonly collectionsService: CollectionsService,
    private readonly collectionsIntegrationService: CollectionsIntegrationService,
  ) {}

  /**
   * UC-024: Detect and classify delinquency
   */
  @Post('detect-delinquency')
  async detectDelinquency(
    @Query('loanId') loanId?: string,
    @Query('postingDate') postingDate?: string,
  ) {
    const date = postingDate ? new Date(postingDate) : undefined;
    return await this.collectionsService.detectAndClassifyDelinquency(loanId, date);
  }

  /**
   * Get delinquent loans
   */
  @Get('delinquent-loans')
  async getDelinquentLoans(@Query('stage') stage?: CollectionStage) {
    return await this.collectionsService.getDelinquentLoans(stage);
  }

  /**
   * UC-025: Send collection notice
   */
  @Post('notices')
  async sendNotice(
    @Body() body: { loanId: string; noticeType: string; workflowId?: string },
  ) {
    const { loanId, noticeType, workflowId } = body;
    // Get DPD from loan
    // This would be better as a separate service call
    return await this.collectionsService.sendCollectionNotice(
      loanId,
      noticeType as any,
      0, // Would get from loan
      workflowId,
    );
  }

  /**
   * UC-026: Create collection activity
   */
  @Post('activities')
  async createActivity(@Body() dto: CreateCollectionActivityDto, @Request() req: any) {
    return await this.collectionsService.createCollectionActivity(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * Get collection activities for loan
   */
  @Get('loans/:loanId/activities')
  async getLoanActivities(@Param('loanId') loanId: string) {
    // Would need to inject repository or create method
    return { message: 'Get activities for loan', loanId };
  }

  /**
   * UC-027: Create payment arrangement
   */
  @Post('payment-arrangements')
  async createPaymentArrangement(
    @Body() dto: CreatePaymentArrangementDto,
    @Request() req: any,
  ) {
    return await this.collectionsService.createPaymentArrangement(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * Get payment arrangements for loan
   */
  @Get('loans/:loanId/payment-arrangements')
  async getLoanPaymentArrangements(@Param('loanId') loanId: string) {
    return { message: 'Get payment arrangements for loan', loanId };
  }

  /**
   * UC-028: Create skip trace
   */
  @Post('skip-traces')
  async createSkipTrace(@Body() dto: CreateSkipTraceDto, @Request() req: any) {
    return await this.collectionsService.createSkipTrace(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * UC-029: Create legal action
   */
  @Post('legal-actions')
  async createLegalAction(@Body() dto: CreateLegalActionDto, @Request() req: any) {
    return await this.collectionsService.createLegalAction(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * Approve legal action
   */
  @Post('legal-actions/:id/approve')
  async approveLegalAction(
    @Param('id') id: string,
    @Body() body: { remarks?: string },
    @Request() req: any,
  ) {
    return { message: 'Approve legal action', id, remarks: body.remarks };
  }

  /**
   * UC-030: Create third-party placement
   */
  @Post('third-party-placements')
  async createThirdPartyPlacement(
    @Body() dto: CreateThirdPartyPlacementDto,
    @Request() req: any,
  ) {
    return await this.collectionsService.createThirdPartyPlacement(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * UC-031: Process charge-off
   */
  @Post('charge-off')
  async processChargeOff(
    @Body() body: { loanId: string; chargeOffDate?: string },
    @Request() req: any,
  ) {
    const chargeOffDate = body.chargeOffDate ? new Date(body.chargeOffDate) : new Date();
    return await this.collectionsService.processChargeOff(
      body.loanId,
      chargeOffDate,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * Create promise to pay
   */
  @Post('promise-to-pay')
  async createPromiseToPay(@Body() dto: CreatePromiseToPayDto, @Request() req: any) {
    return await this.collectionsService.createPromiseToPay(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * Get collection workflow for loan
   */
  @Get('loans/:loanId/workflow')
  async getLoanWorkflow(@Param('loanId') loanId: string) {
    return { message: 'Get workflow for loan', loanId };
  }

  /**
   * Get collection agencies
   */
  @Get('agencies')
  async getAgencies() {
    return { message: 'Get collection agencies' };
  }

  // Integration Service Endpoints

  @Post('notices/:id/send-pdf')
  async sendNoticeWithPDF(
    @Param('id') id: string,
    @Body() body: { loanId: string; noticeType: string; daysPastDue: number; amountDue: number },
  ) {
    await this.collectionsIntegrationService.sendCollectionNoticeWithPDF(
      id,
      body.loanId,
      body.noticeType as any,
      body.daysPastDue,
      body.amountDue,
    );
    return { success: true, message: 'Collection notice sent with PDF' };
  }

  @Get('export-data')
  async exportCollectionData(
    @Query('loanId') loanId?: string,
    @Query('noticeType') noticeType?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const excelBuffer = await this.collectionsIntegrationService.exportCollectionData({
      loanId,
      noticeType: noticeType as any,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
    return {
      success: true,
      excel: excelBuffer.toString('base64'),
      filename: 'collection-data.xlsx',
    };
  }

  @Get('loans/:loanId/payment-arrangement-pdf')
  async getPaymentArrangementPDF(
    @Param('loanId') loanId: string,
    @Body() body: {
      totalAmount: number;
      monthlyPayment: number;
      numberOfPayments: number;
      startDate: string;
      endDate: string;
    },
  ) {
    const result = await this.collectionsIntegrationService.generatePaymentArrangementPDF(loanId, {
      totalAmount: body.totalAmount,
      monthlyPayment: body.monthlyPayment,
      numberOfPayments: body.numberOfPayments,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
    return {
      success: true,
      pdf: result.pdf.toString('base64'),
      qrCode: result.qrCode,
    };
  }
}

