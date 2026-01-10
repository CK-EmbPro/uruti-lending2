import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OpenBankingService } from './services/open-banking.service';
import { ConnectBankAccountDto } from './dto/open-banking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Open Banking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('open-banking')
export class OpenBankingController {
  constructor(private readonly openBankingService: OpenBankingService) {}

  @Post('connect')
  @ApiOperation({ summary: 'Connect bank account' })
  @ApiResponse({ status: 201, description: 'Bank account connected successfully' })
  connectBankAccount(
    @Request() req: any,
    @Body() connectDto: ConnectBankAccountDto,
  ) {
    const customerId = req.user.customerId || req.user.id;
    return this.openBankingService.connectBankAccount(customerId, connectDto);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get bank accounts' })
  @ApiResponse({ status: 200, description: 'List of bank accounts' })
  getBankAccounts(@Request() req: any) {
    const customerId = req.user.customerId || req.user.id;
    return this.openBankingService.getBankAccounts(customerId);
  }

  @Get('accounts/:id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiResponse({ status: 200, description: 'Account balance' })
  getAccountBalance(@Param('id') id: string) {
    return this.openBankingService.getAccountBalance(id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get bank transactions' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  getTransactions(
    @Request() req: any,
    @Query('accountId') accountId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    const customerId = req.user.customerId || req.user.id;
    return this.openBankingService.getTransactions(
      customerId,
      accountId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit,
    );
  }

  @Post('sync/:connectionId')
  @ApiOperation({ summary: 'Sync bank transactions' })
  @ApiResponse({ status: 200, description: 'Transactions synced successfully' })
  syncTransactions(@Param('connectionId') connectionId: string) {
    return this.openBankingService.syncTransactions(connectionId);
  }

  @Get('income-verification')
  @ApiOperation({ summary: 'Verify income from bank data' })
  @ApiResponse({ status: 200, description: 'Income verification data' })
  verifyIncome(@Request() req: any) {
    const customerId = req.user.customerId || req.user.id;
    return this.openBankingService.verifyIncome(customerId);
  }

  @Delete('connections/:id')
  @ApiOperation({ summary: 'Disconnect bank account' })
  @ApiResponse({ status: 200, description: 'Bank account disconnected' })
  disconnectBankAccount(@Param('id') id: string) {
    return this.openBankingService.disconnectBankAccount(id);
  }
}
