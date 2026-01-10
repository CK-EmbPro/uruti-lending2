import {
  Controller,
  Get,
  Post,
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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoanInterestAccrualService } from './loan-interest-accrual.service';

@ApiTags('loan-interest-accrual')
@ApiBearerAuth('JWT-auth')
@Controller('loan-interest-accruals')
export class LoanInterestAccrualController {
  constructor(
    private readonly loanInterestAccrualService: LoanInterestAccrualService,
  ) {}

  @Post('accrue')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Accrue interest', description: 'Accrues interest for loans based on the specified date' })
  @ApiQuery({ name: 'date', required: false, description: 'Accrual date (ISO 8601), defaults to today' })
  @ApiQuery({ name: 'loanId', required: false, description: 'Accrue interest for specific loan' })
  @ApiResponse({ status: 201, description: 'Interest accrued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  accrue(@Query('date') date?: string, @Query('loanId') loanId?: string) {
    return this.loanInterestAccrualService.accrue(date, loanId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all interest accruals', description: 'Retrieves a list of all interest accrual records' })
  @ApiQuery({ name: 'loanId', required: false, description: 'Filter by loan ID' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date (ISO 8601)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'List of accruals retrieved successfully' })
  findAll(@Query('loanId') loanId?: string, @Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.loanInterestAccrualService.findAll(loanId, fromDate, toDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get interest accrual by ID', description: 'Retrieves a specific interest accrual by its unique identifier' })
  @ApiParam({ name: 'id', description: 'Accrual UUID', type: String })
  @ApiResponse({ status: 200, description: 'Accrual found' })
  @ApiResponse({ status: 404, description: 'Accrual not found' })
  findOne(@Param('id') id: string) {
    return this.loanInterestAccrualService.findOne(id);
  }

  @Get('loan/:loanId')
  @ApiOperation({ summary: 'Get accruals by loan ID', description: 'Retrieves all interest accruals for a specific loan' })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Accruals found' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  findByLoanId(@Param('loanId') loanId: string) {
    return this.loanInterestAccrualService.findByLoanId(loanId);
  }
}

