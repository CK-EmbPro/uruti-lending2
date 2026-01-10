import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CustomerServiceService } from './services/customer-service.service';
import { CreatePaymentExtensionDto } from './dto/create-payment-extension.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { CreateAccountUpdateDto } from './dto/create-account-update.dto';
import { CreateFeeWaiverDto } from './dto/create-fee-waiver.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Controller('customer-service')
@UseGuards(JwtAuthGuard)
export class CustomerServiceController {
  constructor(private readonly customerServiceService: CustomerServiceService) {}

  /**
   * UC-032: Payment Extension
   */
  @Post('payment-extensions')
  async createPaymentExtension(
    @Body() dto: CreatePaymentExtensionDto,
    @Request() req: any,
  ) {
    return await this.customerServiceService.createPaymentExtension(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('payment-extensions/:id/approve')
  async approvePaymentExtension(
    @Param('id') id: string,
    @Body() body: { remarks?: string },
    @Request() req: any,
  ) {
    return await this.customerServiceService.approvePaymentExtension(
      id,
      req.user.id,
      req.user.name || req.user.email,
      body.remarks,
    );
  }

  @Post('payment-extensions/:id/deny')
  async denyPaymentExtension(
    @Param('id') id: string,
    @Body() body: { denialReason: string },
    @Request() req: any,
  ) {
    return await this.customerServiceService.denyPaymentExtension(
      id,
      req.user.id,
      req.user.name || req.user.email,
      body.denialReason,
    );
  }

  @Get('loans/:loanId/payment-extensions')
  async getLoanExtensions(@Param('loanId') loanId: string) {
    return await this.customerServiceService.getLoanExtensions(loanId);
  }

  /**
   * UC-033: Dispute Resolution
   */
  @Post('disputes')
  async createDispute(@Body() dto: CreateDisputeDto, @Request() req: any) {
    return await this.customerServiceService.createDispute(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('disputes/:id/resolve')
  async resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @Request() req: any,
  ) {
    return await this.customerServiceService.resolveDispute(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('disputes/:id/escalate')
  async escalateDispute(
    @Param('id') id: string,
    @Body() body: { escalatedTo: string; reason: string },
    @Request() req: any,
  ) {
    return await this.customerServiceService.escalateDispute(
      id,
      body.escalatedTo,
      body.reason,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('loans/:loanId/disputes')
  async getLoanDisputes(@Param('loanId') loanId: string) {
    return await this.customerServiceService.getLoanDisputes(loanId);
  }

  /**
   * UC-034: Account Update
   */
  @Post('account-updates')
  async createAccountUpdate(
    @Body() dto: CreateAccountUpdateDto,
    @Request() req: any,
  ) {
    return await this.customerServiceService.createAccountUpdate(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('account-updates/:id/verify-and-process')
  async verifyAndProcessAccountUpdate(
    @Param('id') id: string,
    @Body() body: { verificationMethod: string },
    @Request() req: any,
  ) {
    return await this.customerServiceService.verifyAndProcessAccountUpdate(
      id,
      body.verificationMethod,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('loans/:loanId/account-updates')
  async getLoanAccountUpdates(@Param('loanId') loanId: string) {
    return await this.customerServiceService.getLoanAccountUpdates(loanId);
  }

  /**
   * UC-035: Fee Waiver
   */
  @Post('fee-waivers')
  async createFeeWaiver(@Body() dto: CreateFeeWaiverDto, @Request() req: any) {
    return await this.customerServiceService.createFeeWaiver(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('fee-waivers/:id/approve')
  async approveFeeWaiver(
    @Param('id') id: string,
    @Body() body: { remarks?: string },
    @Request() req: any,
  ) {
    return await this.customerServiceService.approveFeeWaiver(
      id,
      req.user.id,
      req.user.name || req.user.email,
      body.remarks,
    );
  }

  @Post('fee-waivers/:id/deny')
  async denyFeeWaiver(
    @Param('id') id: string,
    @Body() body: { denialReason: string },
    @Request() req: any,
  ) {
    return await this.customerServiceService.denyFeeWaiver(
      id,
      req.user.id,
      req.user.name || req.user.email,
      body.denialReason,
    );
  }

  @Get('loans/:loanId/fee-waivers')
  async getLoanFeeWaivers(@Param('loanId') loanId: string) {
    return await this.customerServiceService.getLoanFeeWaivers(loanId);
  }
}

