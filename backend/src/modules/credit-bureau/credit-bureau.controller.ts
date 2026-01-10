import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreditBureauService } from './services/credit-bureau.service';
import {
  PullCreditReportDto,
  EnableCreditMonitoringDto,
} from './dto/credit-bureau.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('credit-bureau')
@ApiBearerAuth('JWT-auth')
@Controller('credit-bureau')
@UseGuards(CompanyGuard)
export class CreditBureauController {
  constructor(private readonly creditBureauService: CreditBureauService) {}

  @Post('reports/pull')
  @ApiOperation({
    summary: 'Pull credit report',
    description: 'Pulls a credit report from one or multiple credit bureaus (Experian, Equifax, TransUnion). Supports multi-bureau pulls for comprehensive credit assessment.',
  })
  @ApiBody({ type: PullCreditReportDto })
  @ApiResponse({
    status: 201,
    description: 'Credit report pull initiated successfully',
  })
  async pullCreditReport(
    @Body() dto: PullCreditReportDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.creditBureauService.pullCreditReport(dto, companyId);
  }

  @Get('reports/:id')
  @ApiOperation({
    summary: 'Get credit report',
    description: 'Returns a credit report with full details including credit score, factors, accounts summary, payment history, inquiries, and public records.',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit report retrieved successfully',
  })
  async getCreditReport(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.creditBureauService.getCreditReport(id, companyId);
  }

  @Get('reports/customer/:customerId/latest')
  @ApiOperation({
    summary: 'Get latest credit report',
    description: 'Returns the most recent valid credit report for a customer.',
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Latest credit report retrieved successfully',
  })
  async getLatestCreditReport(
    @Param('customerId') customerId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.creditBureauService.getLatestCreditReport(customerId, companyId);
  }

  @Post('monitoring/enable')
  @ApiOperation({
    summary: 'Enable credit monitoring',
    description: 'Enables credit monitoring for a customer with configurable alert preferences. Monitors score changes, new inquiries, accounts, and public records.',
  })
  @ApiBody({ type: EnableCreditMonitoringDto })
  @ApiResponse({
    status: 200,
    description: 'Credit monitoring updated successfully',
  })
  async enableCreditMonitoring(
    @Body() dto: EnableCreditMonitoringDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.creditBureauService.enableCreditMonitoring(dto, companyId);
    return { message: 'Credit monitoring updated successfully' };
  }

  @Get('alerts/:customerId')
  @ApiOperation({
    summary: 'Get credit alerts',
    description: 'Returns credit monitoring alerts for a customer, optionally filtered to unread only.',
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiQuery({ name: 'unreadOnly', required: false, description: 'Return only unread alerts', example: true })
  @ApiResponse({
    status: 200,
    description: 'Credit alerts retrieved successfully',
  })
  async getCreditAlerts(
    @Param('customerId') customerId: string,
    @Query('unreadOnly') unreadOnly: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.creditBureauService.getCreditAlerts(
      customerId,
      companyId,
      unreadOnly === 'true',
    );
  }

  @Patch('alerts/:id/read')
  @ApiOperation({
    summary: 'Mark alert as read',
    description: 'Marks a credit alert as read.',
  })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({
    status: 200,
    description: 'Alert marked as read successfully',
  })
  async markAlertAsRead(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.creditBureauService.markAlertAsRead(id, companyId);
    return { message: 'Alert marked as read successfully' };
  }
}

