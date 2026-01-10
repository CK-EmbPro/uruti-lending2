import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MultiTenantService } from './services/multi-tenant.service';
import { CreateTenantDto, Tenant } from './dto/multi-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Multi-Tenant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('multi-tenant')
export class MultiTenantController {
  constructor(private readonly tenantService: MultiTenantService) {}

  @Post('tenants')
  @ApiOperation({ summary: 'Create tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  createTenant(@Body() createDto: CreateTenantDto) {
    return this.tenantService.createTenant(createDto);
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({ status: 200, description: 'List of tenants' })
  findAllTenants() {
    return this.tenantService.findAllTenants();
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  findOneTenant(@Param('id') id: string) {
    return this.tenantService.findOneTenant(id);
  }

  @Put('tenants/:id')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated' })
  updateTenant(
    @Param('id') id: string,
    @Body() updateData: Partial<Tenant>,
  ) {
    return this.tenantService.updateTenant(id, updateData);
  }

  @Get('tenants/:id/stats')
  @ApiOperation({ summary: 'Get tenant statistics' })
  @ApiResponse({ status: 200, description: 'Tenant statistics' })
  getTenantStats(@Param('id') id: string) {
    return this.tenantService.getTenantStats(id);
  }
}

