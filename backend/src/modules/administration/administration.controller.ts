import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdministrationService } from './services/administration.service';
import { PermissionSeedService } from './services/permission-seed.service';
import {
  CreateUserAccountDto,
  UpdateUserAccountDto,
  ActivateUserAccountDto,
  QueryUserAccountsDto,
} from './dto/user-account.dto';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import {
  CreateProductConfigurationDto,
  UpdateProductConfigurationDto,
  TestProductConfigurationDto,
  ActivateProductConfigurationDto,
} from './dto/product-configuration.dto';
import {
  CreateBusinessRuleDto,
  UpdateBusinessRuleDto,
  TestBusinessRuleDto,
  PromoteBusinessRuleDto,
  AnalyzeBusinessRuleImpactDto,
} from './dto/business-rule.dto';
import {
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
  ApplyFeeScheduleDto,
} from './dto/fee-schedule.dto';
import { UserStatus } from '../../common/enums/user-status.enum';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { RuleStatus } from '../../common/enums/rule-status.enum';

@ApiTags('Administration')
@ApiBearerAuth()
@Controller('administration')
export class AdministrationController {
  private readonly logger = new Logger(AdministrationController.name);

  constructor(
    private readonly administrationService: AdministrationService,
    private readonly permissionSeedService: PermissionSeedService,
  ) {}

  /**
   * UC-051: User Account Management
   */

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create user account',
    description: 'Creates a new user account with assigned roles and permissions',
  })
  @ApiResponse({ status: 201, description: 'User account created successfully' })
  async createUserAccount(@Body() dto: CreateUserAccountDto, @Request() req: any) {
    return this.administrationService.createUserAccount(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Put('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user account',
    description: 'Updates user account information and roles',
  })
  async updateUserAccount(
    @Param('id') id: string,
    @Body() dto: UpdateUserAccountDto,
    @Request() req: any,
  ) {
    return this.administrationService.updateUserAccount(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate user account',
    description: 'Activates a pending user account',
  })
  async activateUserAccount(
    @Param('id') id: string,
    @Body() dto: ActivateUserAccountDto,
    @Request() req: any,
  ) {
    return this.administrationService.activateUserAccount(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user accounts',
    description: 'Retrieves user accounts with optional filters',
  })
  async getUserAccounts(@Query() filters: QueryUserAccountsDto) {
    return this.administrationService.getUserAccounts(filters);
  }

  @Get('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user account',
    description: 'Retrieves a specific user account with roles and permissions',
  })
  async getUserAccount(@Param('id') id: string) {
    return this.administrationService.getUserAccount(id);
  }

  @Get('users/:id/activity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user activity logs',
    description: 'Retrieves activity logs for a user account',
  })
  async getUserActivityLogs(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.administrationService.getUserActivityLogs(id, limit || 50);
  }

  /**
   * UC-052: Product Configuration
   */

  @Post('product-configurations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create product configuration',
    description: 'Creates a new loan product configuration with eligibility criteria and pricing',
  })
  @ApiResponse({ status: 201, description: 'Product configuration created successfully' })
  async createProductConfiguration(@Body() dto: CreateProductConfigurationDto, @Request() req: any) {
    return this.administrationService.createProductConfiguration(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Put('product-configurations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update product configuration',
    description: 'Updates product configuration settings',
  })
  async updateProductConfiguration(
    @Param('id') id: string,
    @Body() dto: UpdateProductConfigurationDto,
    @Request() req: any,
  ) {
    return this.administrationService.updateProductConfiguration(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('product-configurations/:id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test product configuration',
    description: 'Tests product configuration in sandbox environment',
  })
  async testProductConfiguration(
    @Param('id') id: string,
    @Body() dto: TestProductConfigurationDto,
    @Request() req: any,
  ) {
    return this.administrationService.testProductConfiguration(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('product-configurations/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate product configuration',
    description: 'Activates a tested product configuration and creates corresponding loan product',
  })
  async activateProductConfiguration(
    @Param('id') id: string,
    @Body() dto: ActivateProductConfigurationDto,
    @Request() req: any,
  ) {
    return this.administrationService.activateProductConfiguration(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('product-configurations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get product configurations',
    description: 'Retrieves product configurations with optional filters',
  })
  async getProductConfigurations(
    @Query('status') status?: ProductStatus,
    @Query('companyId') companyId?: string,
  ) {
    return this.administrationService.getProductConfigurations({ status, companyId });
  }

  /**
   * UC-053: Business Rules Management
   */

  @Post('business-rules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create business rule',
    description: 'Creates a new business rule for decisioning',
  })
  @ApiResponse({ status: 201, description: 'Business rule created successfully' })
  async createBusinessRule(@Body() dto: CreateBusinessRuleDto, @Request() req: any) {
    return this.administrationService.createBusinessRule(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Put('business-rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update business rule',
    description: 'Updates business rule definition',
  })
  async updateBusinessRule(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessRuleDto,
    @Request() req: any,
  ) {
    return this.administrationService.updateBusinessRule(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('business-rules/:id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test business rule',
    description: 'Tests business rule in sandbox environment',
  })
  async testBusinessRule(
    @Param('id') id: string,
    @Body() dto: TestBusinessRuleDto,
    @Request() req: any,
  ) {
    return this.administrationService.testBusinessRule(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('business-rules/:id/analyze-impact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze business rule impact',
    description: 'Analyzes the impact of a business rule on the portfolio',
  })
  async analyzeBusinessRuleImpact(
    @Param('id') id: string,
    @Body() dto: AnalyzeBusinessRuleImpactDto,
    @Request() req: any,
  ) {
    return this.administrationService.analyzeBusinessRuleImpact(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('business-rules/:id/promote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Promote business rule to production',
    description: 'Promotes a tested business rule to production with optional gradual rollout',
  })
  async promoteBusinessRule(
    @Param('id') id: string,
    @Body() dto: PromoteBusinessRuleDto,
    @Request() req: any,
  ) {
    return this.administrationService.promoteBusinessRule(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('business-rules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get business rules',
    description: 'Retrieves business rules with optional filters',
  })
  async getBusinessRules(
    @Query('status') status?: RuleStatus,
    @Query('ruleCategory') ruleCategory?: string,
  ) {
    return this.administrationService.getBusinessRules({ status, ruleCategory });
  }

  /**
   * UC-054: Fee Schedule Management
   */

  @Post('fee-schedules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create fee schedule',
    description: 'Creates a new fee schedule with effective date and grandfathering rules',
  })
  @ApiResponse({ status: 201, description: 'Fee schedule created successfully' })
  async createFeeSchedule(@Body() dto: CreateFeeScheduleDto, @Request() req: any) {
    return this.administrationService.createFeeSchedule(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Put('fee-schedules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update fee schedule',
    description: 'Updates fee schedule amounts and effective dates',
  })
  async updateFeeSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateFeeScheduleDto,
    @Request() req: any,
  ) {
    return this.administrationService.updateFeeSchedule(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('fee-schedules/:id/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apply fee schedule',
    description: 'Applies fee schedule to affected loans and sends customer notifications',
  })
  async applyFeeSchedule(
    @Param('id') id: string,
    @Body() dto: ApplyFeeScheduleDto,
    @Request() req: any,
  ) {
    return this.administrationService.applyFeeSchedule(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('fee-schedules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get fee schedules',
    description: 'Retrieves fee schedules with optional filters',
  })
  async getFeeSchedules(
    @Query('feeType') feeType?: string,
    @Query('companyId') companyId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.administrationService.getFeeSchedules({ feeType, companyId, isActive });
  }

  /**
   * Role and Permission Management
   */

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create role',
    description: 'Creates a new role with assigned permissions',
  })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async createRole(@Body() dto: CreateRoleDto, @Request() req: any) {
    return this.administrationService.createRole(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Put('roles/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update role',
    description: 'Updates role information and permissions',
  })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Request() req: any,
  ) {
    return this.administrationService.updateRole(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get roles',
    description: 'Retrieves all roles with permissions',
  })
  async getRoles() {
    return this.administrationService.getRoles();
  }

  @Get('permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get permissions',
    description: 'Retrieves all available permissions',
  })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getPermissions() {
    const permissions = await this.administrationService.getPermissions();
    return permissions || [];
  }

  @Post('seed-permissions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed default permissions and roles',
    description: 'Creates default permissions and roles for the system',
  })
  @ApiResponse({ status: 201, description: 'Permissions and roles seeded successfully' })
  async seedPermissions() {
    try {
      this.logger.log('Starting permission seeding...');
      
      await this.permissionSeedService.seedDefaultPermissions();
      
      const permissions = await this.administrationService.getPermissions();
      const roles = await this.administrationService.getRoles();
      
      this.logger.log(`Seeding completed: ${permissions.length} permissions, ${roles.length} roles`);
      
      return {
        message: 'Permissions and roles seeded successfully',
        permissionsCreated: permissions.length,
        rolesCreated: roles.length,
      };
    } catch (error: any) {
      this.logger.error(`Error seeding permissions: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to seed permissions: ${error.message}`,
      );
    }
  }
}

