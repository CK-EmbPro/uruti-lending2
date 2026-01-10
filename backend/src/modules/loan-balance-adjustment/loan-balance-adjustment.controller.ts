import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { LoanBalanceAdjustmentService } from './loan-balance-adjustment.service';
import { CreateLoanBalanceAdjustmentDto } from './dto/create-loan-balance-adjustment.dto';
import { UpdateLoanBalanceAdjustmentDto } from './dto/update-loan-balance-adjustment.dto';

@ApiTags('loan-balance-adjustments')
@ApiBearerAuth('JWT-auth')
@Controller('loan-balance-adjustments')
export class LoanBalanceAdjustmentController {
  constructor(
    private readonly loanBalanceAdjustmentService: LoanBalanceAdjustmentService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create loan balance adjustment',
    description:
      'Creates a credit or debit adjustment entry for a loan. Updates loan credit_adjustment_amount or debit_adjustment_amount accordingly.',
  })
  @ApiBody({ type: CreateLoanBalanceAdjustmentDto })
  @ApiResponse({
    status: 201,
    description: 'Adjustment created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid adjustment amount or loan status',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  create(@Body() createLoanBalanceAdjustmentDto: CreateLoanBalanceAdjustmentDto) {
    return this.loanBalanceAdjustmentService.create(createLoanBalanceAdjustmentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all adjustments',
    description: 'Retrieves all adjustment entries. Optionally filter by loanId query parameter.',
  })
  @ApiResponse({ status: 200, description: 'List of adjustments' })
  findAll(@Query('loanId') loanId?: string) {
    return this.loanBalanceAdjustmentService.findAll(loanId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get adjustment by ID',
    description: 'Retrieves a specific adjustment entry by ID',
  })
  @ApiParam({ name: 'id', description: 'Adjustment UUID', type: String })
  @ApiResponse({ status: 200, description: 'Adjustment details' })
  @ApiResponse({ status: 404, description: 'Adjustment not found' })
  findOne(@Param('id') id: string) {
    return this.loanBalanceAdjustmentService.findOne(id);
  }

  @Get('loan/:loanId')
  @ApiOperation({
    summary: 'Get adjustments by loan ID',
    description: 'Retrieves all adjustment entries for a specific loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'List of adjustments for the loan' })
  findByLoanId(@Param('loanId') loanId: string) {
    return this.loanBalanceAdjustmentService.findByLoanId(loanId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update adjustment',
    description:
      'Updates an adjustment entry. Only limited fields can be updated (e.g., cost center, reference number, remarks).',
  })
  @ApiParam({ name: 'id', description: 'Adjustment UUID', type: String })
  @ApiBody({ type: UpdateLoanBalanceAdjustmentDto })
  @ApiResponse({ status: 200, description: 'Adjustment updated successfully' })
  @ApiResponse({ status: 404, description: 'Adjustment not found' })
  update(
    @Param('id') id: string,
    @Body() updateLoanBalanceAdjustmentDto: UpdateLoanBalanceAdjustmentDto,
  ) {
    return this.loanBalanceAdjustmentService.update(id, updateLoanBalanceAdjustmentDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete adjustment',
    description:
      'Deletes an adjustment entry. This will recalculate loan adjustment amounts.',
  })
  @ApiParam({ name: 'id', description: 'Adjustment UUID', type: String })
  @ApiResponse({ status: 200, description: 'Adjustment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Adjustment not found' })
  remove(@Param('id') id: string) {
    return this.loanBalanceAdjustmentService.remove(id);
  }
}

