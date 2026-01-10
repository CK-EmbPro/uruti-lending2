import {
  Controller,
  Get,
  Post,
  Body,
  Query,
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
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CheckDuplicateCustomerDto } from './dto/check-duplicate.dto';
import { ApplicantType } from '../../common/enums/applicant-type.enum';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseGuards(CompanyGuard) // Enforce multi-tenancy
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('check-duplicate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check for duplicate customers',
    description:
      'Checks if a customer with similar information already exists. Matches on name, email, phone, PAN, or Aadhaar.',
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicate check completed',
  })
  async checkDuplicate(@Body() dto: CheckDuplicateCustomerDto) {
    return this.customerService.checkDuplicateCustomer(dto);
  }

  @Get(':applicantType/:applicantId/loans')
  @ApiOperation({
    summary: 'Get all loans for a customer',
    description: 'Retrieves all loans associated with a specific customer/applicant for the authenticated user\'s company',
  })
  @ApiParam({ name: 'applicantType', enum: ApplicantType, description: 'Applicant type' })
  @ApiParam({ name: 'applicantId', description: 'Applicant ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Customer loans retrieved successfully',
  })
  getCustomerLoans(
    @Param('applicantType') applicantType: ApplicantType,
    @Param('applicantId') applicantId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.customerService.getCustomerLoans(
      applicantType,
      applicantId,
      companyId,
    );
  }

  @Get(':applicantType/:applicantId/summary')
  @ApiOperation({
    summary: 'Get customer summary',
    description: 'Retrieves a summary of customer loan portfolio including totals and outstanding amounts for the authenticated user\'s company',
  })
  @ApiParam({ name: 'applicantType', enum: ApplicantType, description: 'Applicant type' })
  @ApiParam({ name: 'applicantId', description: 'Applicant ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Customer summary retrieved successfully',
  })
  getCustomerSummary(
    @Param('applicantType') applicantType: ApplicantType,
    @Param('applicantId') applicantId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return this.customerService.getCustomerSummary(
      applicantType,
      applicantId,
      companyId,
    );
  }
}

