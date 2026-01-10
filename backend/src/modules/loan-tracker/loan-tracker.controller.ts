import {
  Controller,
  Get,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoanTrackerService } from './services/loan-tracker.service';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('loan-tracker')
@ApiBearerAuth('JWT-auth')
@Controller('loan-tracker')
@UseGuards(CompanyGuard)
export class LoanTrackerController {
  constructor(private readonly trackerService: LoanTrackerService) {}

  @Get('loan/:loanId/status')
  @ApiOperation({
    summary: 'Get real-time loan status',
    description: 'Retrieves current loan status and details for real-time tracking',
  })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({
    status: 200,
    description: 'Loan status retrieved successfully',
  })
  async getLoanStatus(
    @Param('loanId') loanId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.trackerService.getLoanStatus(loanId, companyId);
  }

  @Get('application/:applicationId/status')
  @ApiOperation({
    summary: 'Get real-time application status',
    description: 'Retrieves current application status and details for real-time tracking',
  })
  @ApiParam({ name: 'applicationId', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application status retrieved successfully',
  })
  async getApplicationStatus(
    @Param('applicationId') applicationId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.trackerService.getApplicationStatus(applicationId, companyId);
  }
}

