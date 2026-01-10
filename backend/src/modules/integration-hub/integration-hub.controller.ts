import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
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
import { IntegrationHubService } from './services/integration-hub.service';
import {
  CreateIntegrationDto,
  TestIntegrationDto,
} from './dto/integration-hub.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('integration-hub')
@ApiBearerAuth('JWT-auth')
@Controller('integration-hub')
@UseGuards(CompanyGuard)
export class IntegrationHubController {
  constructor(private readonly hubService: IntegrationHubService) {}

  @Post('integrations')
  @ApiOperation({
    summary: 'Create integration',
    description: 'Creates a new third-party integration. Supports payment gateways, accounting systems, CRM, document storage, email/SMS services, credit bureaus, and more.',
  })
  @ApiBody({ type: CreateIntegrationDto })
  @ApiResponse({
    status: 201,
    description: 'Integration created successfully',
  })
  async createIntegration(
    @Body() dto: CreateIntegrationDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.hubService.createIntegration(dto, companyId);
  }

  @Get('integrations')
  @ApiOperation({
    summary: 'Get integrations',
    description: 'Returns all configured integrations for the company.',
  })
  @ApiResponse({
    status: 200,
    description: 'Integrations retrieved successfully',
  })
  async getIntegrations(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.hubService.getIntegrations(companyId);
  }

  @Post('integrations/test')
  @ApiOperation({
    summary: 'Test integration',
    description: 'Tests the connection and configuration of an integration. Returns test results and updates integration status.',
  })
  @ApiBody({ type: TestIntegrationDto })
  @ApiResponse({
    status: 200,
    description: 'Integration test completed',
  })
  async testIntegration(
    @Body() dto: TestIntegrationDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.hubService.testIntegration(dto, companyId);
  }

  @Patch('integrations/:id/toggle')
  @ApiOperation({
    summary: 'Toggle integration',
    description: 'Activates or deactivates an integration.',
  })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Integration status updated successfully',
  })
  async toggleIntegration(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.hubService.toggleIntegration(id, body.isActive, companyId);
    return { message: 'Integration status updated successfully' };
  }

  @Get('available')
  @ApiOperation({
    summary: 'Get available integrations',
    description: 'Returns list of available third-party integrations that can be configured.',
  })
  @ApiResponse({
    status: 200,
    description: 'Available integrations retrieved successfully',
  })
  async getAvailableIntegrations() {
    return await this.hubService.getAvailableIntegrations();
  }
}

