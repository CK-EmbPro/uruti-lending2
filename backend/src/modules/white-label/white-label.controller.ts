import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WhiteLabelService } from './services/white-label.service';
import { CreateWhiteLabelDto, UpdateWhiteLabelDto, WhiteLabelBranding, RevenueShareSummary } from './dto/white-label.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('White Label')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('white-label')
export class WhiteLabelController {
  constructor(private readonly whiteLabelService: WhiteLabelService) {}

  @Post()
  @ApiOperation({ summary: 'Create white label configuration' })
  @ApiResponse({ status: 201, description: 'White label configuration created successfully' })
  create(
    @Body() createDto: CreateWhiteLabelDto,
    @CurrentUser() user: any,
  ) {
    return this.whiteLabelService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all white label configurations' })
  @ApiResponse({ status: 200, description: 'List of white label configurations' })
  findAll() {
    return this.whiteLabelService.findAll();
  }

  @Get('branding/:partnerCode')
  @ApiOperation({ summary: 'Get branding configuration for partner' })
  @ApiResponse({ status: 200, description: 'Branding configuration', type: WhiteLabelBranding })
  getBranding(@Param('partnerCode') partnerCode: string): Promise<WhiteLabelBranding> {
    return this.whiteLabelService.getBranding(partnerCode);
  }

  @Get('domain/:domain')
  @ApiOperation({ summary: 'Get white label configuration by domain' })
  @ApiResponse({ status: 200, description: 'White label configuration' })
  findByDomain(@Param('domain') domain: string) {
    return this.whiteLabelService.findByDomain(domain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get white label configuration by ID' })
  @ApiResponse({ status: 200, description: 'White label configuration' })
  findOne(@Param('id') id: string) {
    return this.whiteLabelService.findOne(id);
  }

  @Get('partner/:partnerCode')
  @ApiOperation({ summary: 'Get white label configuration by partner code' })
  @ApiResponse({ status: 200, description: 'White label configuration' })
  findByPartnerCode(@Param('partnerCode') partnerCode: string) {
    return this.whiteLabelService.findByPartnerCode(partnerCode);
  }

  @Get(':id/revenue-share')
  @ApiOperation({ summary: 'Get revenue share summary' })
  @ApiResponse({ status: 200, description: 'Revenue share summary', type: RevenueShareSummary })
  getRevenueShareSummary(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<RevenueShareSummary> {
    return this.whiteLabelService.getRevenueShareSummary(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update white label configuration' })
  @ApiResponse({ status: 200, description: 'White label configuration updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWhiteLabelDto,
    @CurrentUser() user: any,
  ) {
    return this.whiteLabelService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete white label configuration' })
  @ApiResponse({ status: 200, description: 'White label configuration deleted successfully' })
  remove(@Param('id') id: string) {
    return this.whiteLabelService.remove(id);
  }
}

