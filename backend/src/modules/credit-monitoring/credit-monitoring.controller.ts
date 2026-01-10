import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreditMonitoringService } from './services/credit-monitoring.service';
import {
  CreateCreditMonitoringDto,
  CreditBureau,
} from './dto/credit-monitoring.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Credit Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credit-monitoring')
export class CreditMonitoringController {
  constructor(private readonly creditMonitoringService: CreditMonitoringService) {}

  @Post()
  @ApiOperation({ summary: 'Create credit monitoring' })
  @ApiResponse({ status: 201, description: 'Credit monitoring created successfully' })
  create(
    @Body() createDto: CreateCreditMonitoringDto,
    @CurrentUser() user: any,
  ) {
    return this.creditMonitoringService.createMonitoring(createDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all credit monitoring' })
  @ApiResponse({ status: 200, description: 'List of credit monitoring' })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.creditMonitoringService.findAllMonitoring(
      customerId,
      isActive !== undefined ? isActive === true : undefined,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get credit monitoring summary' })
  @ApiResponse({ status: 200, description: 'Credit monitoring summary' })
  getSummary() {
    return this.creditMonitoringService.getMonitoringSummary();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credit monitoring by ID' })
  @ApiResponse({ status: 200, description: 'Credit monitoring details' })
  findOne(@Param('id') id: string) {
    return this.creditMonitoringService.findOneMonitoring(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update credit monitoring' })
  @ApiResponse({ status: 200, description: 'Credit monitoring updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updates: Partial<CreateCreditMonitoringDto>,
    @CurrentUser() user: any,
  ) {
    return this.creditMonitoringService.updateMonitoring(id, updates, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete credit monitoring' })
  @ApiResponse({ status: 200, description: 'Credit monitoring deleted successfully' })
  remove(@Param('id') id: string) {
    return this.creditMonitoringService.deleteMonitoring(id);
  }

  @Post(':id/check')
  @ApiOperation({ summary: 'Perform manual credit check' })
  @ApiResponse({ status: 200, description: 'Credit check performed successfully' })
  performCheck(@Param('id') id: string) {
    return this.creditMonitoringService.performCreditCheck(id);
  }

  @Get('customers/:customerId/history')
  @ApiOperation({ summary: 'Get credit score history for customer' })
  @ApiResponse({ status: 200, description: 'Credit score history' })
  getHistory(
    @Param('customerId') customerId: string,
    @Query('bureau') bureau?: CreditBureau,
  ) {
    return this.creditMonitoringService.getCreditHistory(customerId, bureau);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get credit alerts' })
  @ApiResponse({ status: 200, description: 'List of credit alerts' })
  getAlerts(
    @Query('customerId') customerId?: string,
    @Query('isRead') isRead?: boolean,
  ) {
    return this.creditMonitoringService.getAlerts(
      customerId,
      isRead !== undefined ? isRead === true : undefined,
    );
  }

  @Patch('alerts/:id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  @ApiResponse({ status: 200, description: 'Alert marked as read' })
  markAlertAsRead(@Param('id') id: string) {
    return this.creditMonitoringService.markAlertAsRead(id);
  }
}

