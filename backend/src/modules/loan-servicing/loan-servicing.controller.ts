import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoanServicingService } from './services/loan-servicing.service';
import {
  CreateServicingTaskDto,
  CreateAutoEscalationRuleDto,
  PaymentRetryConfigDto,
  ServicingTaskStatus,
} from './dto/loan-servicing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Loan Servicing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loan-servicing')
export class LoanServicingController {
  constructor(private readonly loanServicingService: LoanServicingService) {}

  @Post('tasks')
  @ApiOperation({ summary: 'Create servicing task' })
  @ApiResponse({ status: 201, description: 'Servicing task created successfully' })
  createTask(
    @Body() createDto: CreateServicingTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.loanServicingService.createTask(createDto, user.id);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get all servicing tasks' })
  @ApiResponse({ status: 200, description: 'List of servicing tasks' })
  findAllTasks(
    @Query('loanId') loanId?: string,
    @Query('status') status?: ServicingTaskStatus,
  ) {
    return this.loanServicingService.findAllTasks(loanId, status);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get servicing task by ID' })
  @ApiResponse({ status: 200, description: 'Servicing task details' })
  findOneTask(@Param('id') id: string) {
    return this.loanServicingService.findOneTask(id);
  }

  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  updateTaskStatus(
    @Param('id') id: string,
    @Body('status') status: ServicingTaskStatus,
    @Body('result') result?: Record<string, any>,
    @CurrentUser() user?: any,
  ) {
    return this.loanServicingService.updateTaskStatus(id, status, result, user?.id);
  }

  @Post('escalation-rules')
  @ApiOperation({ summary: 'Create auto-escalation rule' })
  @ApiResponse({ status: 201, description: 'Escalation rule created successfully' })
  createEscalationRule(
    @Body() createDto: CreateAutoEscalationRuleDto,
    @CurrentUser() user: any,
  ) {
    return this.loanServicingService.createEscalationRule(createDto, user.id);
  }

  @Get('escalation-rules')
  @ApiOperation({ summary: 'Get all escalation rules' })
  @ApiResponse({ status: 200, description: 'List of escalation rules' })
  findAllEscalationRules() {
    return this.loanServicingService.findAllEscalationRules();
  }

  @Post('loans/:loanId/evaluate-escalation')
  @ApiOperation({ summary: 'Evaluate escalation rules for a loan' })
  @ApiResponse({ status: 200, description: 'Escalation rules evaluated' })
  evaluateEscalation(@Param('loanId') loanId: string) {
    return this.loanServicingService.evaluateEscalationRules(loanId);
  }

  @Post('payments/:repaymentId/retry')
  @ApiOperation({ summary: 'Retry failed payment' })
  @ApiResponse({ status: 200, description: 'Payment retry initiated' })
  retryPayment(
    @Param('repaymentId') repaymentId: string,
    @Body() config: PaymentRetryConfigDto,
  ) {
    return this.loanServicingService.retryPayment(repaymentId, config);
  }

  @Get('delinquency/summary')
  @ApiOperation({ summary: 'Get delinquency summary' })
  @ApiResponse({ status: 200, description: 'Delinquency summary' })
  getDelinquencySummary() {
    return this.loanServicingService.getDelinquencySummary();
  }

  @Get('loans/:loanId/days-past-due')
  @ApiOperation({ summary: 'Calculate days past due for a loan' })
  @ApiResponse({ status: 200, description: 'Days past due calculated' })
  getDaysPastDue(@Param('loanId') loanId: string) {
    return this.loanServicingService.calculateDaysPastDue(loanId);
  }
}

