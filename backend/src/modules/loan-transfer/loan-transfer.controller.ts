import {
  Controller,
  Get,
  Query,
  Param,
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
import { LoanTransferService } from './loan-transfer.service';
import { ApplicantType } from '../../common/enums/applicant-type.enum';

@ApiTags('loan-transfers')
@ApiBearerAuth('JWT-auth')
@Controller('loan-transfers')
export class LoanTransferController {
  constructor(private readonly transferService: LoanTransferService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all loan transfers',
    description: 'Retrieves all loan transfers with optional filtering',
  })
  @ApiQuery({ name: 'fromDate', required: false, description: 'From date (ISO 8601)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'To date (ISO 8601)' })
  @ApiQuery({ name: 'loanId', required: false, description: 'Filter by loan ID' })
  @ApiQuery({ name: 'applicantType', required: false, enum: ApplicantType, description: 'Filter by applicant type' })
  @ApiQuery({ name: 'applicantId', required: false, description: 'Filter by applicant ID' })
  @ApiResponse({
    status: 200,
    description: 'Loan transfers retrieved successfully',
  })
  findAll(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('loanId') loanId?: string,
    @Query('applicantType') applicantType?: ApplicantType,
    @Query('applicantId') applicantId?: string,
  ) {
    return this.transferService.findAll({
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      loanId,
      applicantType,
      applicantId,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get transfer by ID',
    description: 'Retrieves a specific loan transfer by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Transfer UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Transfer found',
  })
  @ApiResponse({
    status: 404,
    description: 'Transfer not found',
  })
  findOne(@Param('id') id: string) {
    return this.transferService.findOne(id);
  }

  @Get('loan/:loanId')
  @ApiOperation({
    summary: 'Get transfers for a loan',
    description: 'Retrieves all transfer records for a specific loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Loan transfers retrieved successfully',
  })
  getLoanTransfers(@Param('loanId') loanId: string) {
    return this.transferService.getLoanTransfers(loanId);
  }

  @Get('customer/:applicantType/:applicantId')
  @ApiOperation({
    summary: 'Get transfers for a customer',
    description: 'Retrieves all transfers where the customer was either the old or new applicant',
  })
  @ApiParam({ name: 'applicantType', enum: ApplicantType, description: 'Applicant type' })
  @ApiParam({ name: 'applicantId', description: 'Applicant ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Customer transfers retrieved successfully',
  })
  getCustomerTransfers(
    @Param('applicantType') applicantType: ApplicantType,
    @Param('applicantId') applicantId: string,
  ) {
    return this.transferService.getCustomerTransfers(applicantType, applicantId);
  }
}

