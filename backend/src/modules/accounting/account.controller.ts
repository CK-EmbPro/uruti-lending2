import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AccountService } from './services/account.service';
import { AccountSeedService } from './services/account-seed.service';
import { CreateAccountDto, UpdateAccountDto, QueryAccountsDto } from './dto/create-account.dto';
import { RootType } from './entities/account.entity';

@ApiTags('accounting')
@ApiBearerAuth('JWT-auth')
@Controller('accounting/accounts')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly accountSeedService: AccountSeedService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create account',
    description: 'Creates a new account in the chart of accounts',
  })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate account code' })
  async create(@Body() createDto: CreateAccountDto) {
    return this.accountService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all accounts',
    description: 'Retrieves all accounts with optional filters',
  })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiQuery({ name: 'accountType', required: false, enum: ['Asset', 'Liability', 'Income', 'Expense', 'Equity'] })
  @ApiQuery({ name: 'rootType', required: false, enum: ['Asset', 'Liability', 'Income', 'Expense', 'Equity'] })
  @ApiQuery({ name: 'isGroup', required: false, type: Boolean })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Accounts retrieved successfully',
  })
  async findAll(@Query() filters: QueryAccountsDto) {
    return this.accountService.findAll(filters);
  }

  @Get('tree')
  @ApiOperation({
    summary: 'Get account tree',
    description: 'Retrieves accounts in hierarchical tree structure',
  })
  @ApiQuery({ name: 'companyId', required: true, type: String })
  @ApiQuery({ name: 'rootType', required: false, enum: ['Asset', 'Liability', 'Income', 'Expense', 'Equity'] })
  @ApiResponse({
    status: 200,
    description: 'Account tree retrieved successfully',
  })
  async getTree(
    @Query('companyId') companyId: string,
    @Query('rootType') rootType?: RootType,
  ) {
    return this.accountService.getAccountTree(companyId, rootType);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get account by ID',
    description: 'Retrieves a specific account',
  })
  @ApiParam({ name: 'id', description: 'Account UUID', type: String })
  @ApiResponse({ status: 200, description: 'Account found' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findOne(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Get account by code',
    description: 'Retrieves an account by code and company',
  })
  @ApiParam({ name: 'code', description: 'Account code', type: String })
  @ApiQuery({ name: 'companyId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Account found' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findByCode(
    @Param('code') code: string,
    @Query('companyId') companyId: string,
  ) {
    const account = await this.accountService.findByCode(code, companyId);
    if (!account) {
      throw new Error(`Account with code ${code} not found`);
    }
    return account;
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update account',
    description: 'Updates an existing account',
  })
  @ApiParam({ name: 'id', description: 'Account UUID', type: String })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateAccountDto) {
    return this.accountService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete account',
    description: 'Deactivates an account (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'Account UUID', type: String })
  @ApiResponse({
    status: 204,
    description: 'Account deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete account with children' })
  async delete(@Param('id') id: string) {
    await this.accountService.delete(id);
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed Chart of Accounts',
    description: 'Creates default Chart of Accounts for a company',
  })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Force recreate even if accounts exist' })
  @ApiResponse({
    status: 201,
    description: 'Chart of Accounts seeded successfully',
  })
  async seedAccounts(
    @Query('companyId') companyId?: string,
    @Query('force') force?: string,
  ) {
    await this.accountSeedService.seedChartOfAccounts(
      companyId,
      force === 'true',
    );
    return { message: 'Chart of Accounts seeded successfully' };
  }
}

