import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoanDemandService } from './loan-demand.service';

@ApiTags('loan-demands')
@ApiBearerAuth('JWT-auth')
@Controller('loan-demands')
export class LoanDemandController {
  constructor(private readonly loanDemandService: LoanDemandService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate loan demands', description: 'Generates loan demands for pending repayment schedule entries' })
  @ApiQuery({ name: 'loanId', required: false, description: 'Generate demands for specific loan' })
  @ApiQuery({ name: 'date', required: false, description: 'Generate demands for specific date (ISO 8601)' })
  @ApiResponse({ status: 201, description: 'Demands generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  generate(@Query('loanId') loanId?: string, @Query('date') date?: string) {
    return this.loanDemandService.generate(loanId, date);
  }

  @Get()
  @ApiOperation({ summary: 'Get all loan demands', description: 'Retrieves a list of all loan demands' })
  @ApiQuery({ name: 'loanId', required: false, description: 'Filter by loan ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'List of demands retrieved successfully' })
  findAll(@Query('loanId') loanId?: string, @Query('status') status?: string) {
    return this.loanDemandService.findAll(loanId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get loan demand by ID', description: 'Retrieves a specific loan demand by its unique identifier' })
  @ApiParam({ name: 'id', description: 'Demand UUID', type: String })
  @ApiResponse({ status: 200, description: 'Demand found' })
  @ApiResponse({ status: 404, description: 'Demand not found' })
  findOne(@Param('id') id: string) {
    return this.loanDemandService.findOne(id);
  }

  @Get('loan/:loanId')
  @ApiOperation({ summary: 'Get demands by loan ID', description: 'Retrieves all demands for a specific loan' })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Demands found' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  findByLoanId(@Param('loanId') loanId: string) {
    return this.loanDemandService.findByLoanId(loanId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete loan demand', description: 'Permanently deletes a loan demand' })
  @ApiParam({ name: 'id', description: 'Demand UUID', type: String })
  @ApiResponse({ status: 204, description: 'Demand deleted successfully' })
  @ApiResponse({ status: 404, description: 'Demand not found' })
  remove(@Param('id') id: string) {
    return this.loanDemandService.remove(id);
  }
}

