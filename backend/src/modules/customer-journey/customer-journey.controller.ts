import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomerJourneyService } from './services/customer-journey.service';
import {
  GetCustomerJourneyDto,
} from './dto/customer-journey.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('customer-journey')
@ApiBearerAuth('JWT-auth')
@Controller('customer-journey')
@UseGuards(CompanyGuard)
export class CustomerJourneyController {
  constructor(private readonly journeyService: CustomerJourneyService) {}

  @Post('journey')
  @ApiOperation({
    summary: 'Get customer journey',
    description: 'Returns comprehensive customer journey mapping including timeline, stages, touchpoints, conversion rates, and recommended actions.',
  })
  @ApiBody({ type: GetCustomerJourneyDto })
  @ApiResponse({
    status: 200,
    description: 'Customer journey retrieved successfully',
  })
  async getCustomerJourney(
    @Body() dto: GetCustomerJourneyDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.journeyService.getCustomerJourney(dto, companyId);
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get journey analytics',
    description: 'Returns aggregate journey analytics including average time in stages, conversion rates, drop-off analysis, touchpoint effectiveness, and common journey paths.',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({
    status: 200,
    description: 'Journey analytics retrieved successfully',
  })
  async getJourneyAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.journeyService.getJourneyAnalytics(
      companyId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}

