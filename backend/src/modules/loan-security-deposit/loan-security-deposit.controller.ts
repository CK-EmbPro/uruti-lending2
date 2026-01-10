import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoanSecurityDepositService } from './loan-security-deposit.service';
import { CreateSecurityDepositUsageDto } from './dto/create-security-deposit-usage.dto';

@ApiTags('loan-security-deposit')
@ApiBearerAuth('JWT-auth')
@Controller('loan-security-deposit')
export class LoanSecurityDepositController {
  constructor(
    private readonly securityDepositService: LoanSecurityDepositService,
  ) {}

  @Post(':loanId/add')
  @ApiOperation({
    summary: 'Add security deposit',
    description: 'Adds security deposit amount to a loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 10000 },
      },
      required: ['amount'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Security deposit added successfully',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  addDeposit(
    @Param('loanId') loanId: string,
    @Body() body: { amount: number },
  ) {
    return this.securityDepositService.addSecurityDeposit(loanId, body.amount);
  }

  @Post(':loanId/use')
  @ApiOperation({
    summary: 'Use security deposit',
    description: 'Uses security deposit for payment',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiBody({ type: CreateSecurityDepositUsageDto })
  @ApiResponse({
    status: 200,
    description: 'Security deposit used successfully',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 400, description: 'Insufficient security deposit' })
  useDeposit(
    @Param('loanId') loanId: string,
    @Body() usageDto: CreateSecurityDepositUsageDto,
  ) {
    return this.securityDepositService.useSecurityDeposit(loanId, usageDto);
  }

  @Post(':loanId/refund')
  @ApiOperation({
    summary: 'Refund security deposit',
    description: 'Refunds used security deposit',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 5000 },
        remarks: { type: 'string', example: 'Partial refund' },
      },
      required: ['amount'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Security deposit refunded successfully',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  refundDeposit(
    @Param('loanId') loanId: string,
    @Body() body: { amount: number; remarks?: string },
  ) {
    return this.securityDepositService.refundSecurityDeposit(
      loanId,
      body.amount,
      body.remarks,
    );
  }

  @Get(':loanId/history')
  @ApiOperation({
    summary: 'Get usage history',
    description: 'Retrieves security deposit usage history for a loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Usage history retrieved successfully',
  })
  getHistory(@Param('loanId') loanId: string) {
    return this.securityDepositService.getUsageHistory(loanId);
  }

  @Get(':loanId/summary')
  @ApiOperation({
    summary: 'Get security deposit summary',
    description: 'Retrieves security deposit summary for a loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Summary retrieved successfully',
  })
  getSummary(@Param('loanId') loanId: string) {
    return this.securityDepositService.getSecurityDepositSummary(loanId);
  }
}

