import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MarketingAutomationService } from './services/marketing-automation.service';
import {
  CreateCampaignDto,
} from './dto/marketing-automation.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('marketing-automation')
@ApiBearerAuth('JWT-auth')
@Controller('marketing-automation')
@UseGuards(CompanyGuard)
export class MarketingAutomationController {
  constructor(private readonly automationService: MarketingAutomationService) {}

  @Post('campaigns')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create marketing campaign',
    description: 'Creates a new marketing campaign with support for email, SMS, push, in-app, or multi-channel. Supports automated triggers, segmentation, and A/B testing.',
  })
  @ApiBody({ type: CreateCampaignDto })
  @ApiResponse({
    status: 201,
    description: 'Campaign created successfully',
  })
  async createCampaign(
    @Body() dto: CreateCampaignDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.automationService.createCampaign(dto, companyId);
  }

  @Post('campaigns/:id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute campaign',
    description: 'Executes a draft or scheduled campaign. Calculates recipients and sends campaign messages.',
  })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign executed successfully',
  })
  async executeCampaign(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.automationService.executeCampaign(id, companyId);
  }

  @Get('campaigns')
  @ApiOperation({
    summary: 'Get all campaigns',
    description: 'Returns all marketing campaigns for the company.',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaigns retrieved successfully',
  })
  async getCampaigns(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.automationService.getCampaigns(companyId);
  }

  @Get('campaigns/:id/analytics')
  @ApiOperation({
    summary: 'Get campaign analytics',
    description: 'Returns comprehensive analytics for a campaign including metrics, rates, and time-series data.',
  })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign analytics retrieved successfully',
  })
  async getCampaignAnalytics(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.automationService.getCampaignAnalytics(id, companyId);
  }
}

