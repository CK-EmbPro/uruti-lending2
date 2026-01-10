import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PreApprovalService } from './services/pre-approval.service';
import { CreatePreApprovalDto } from './dto/pre-approval.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('pre-approval')
@ApiBearerAuth('JWT-auth')
@Controller('pre-approval')
@UseGuards(CompanyGuard)
export class PreApprovalController {
  constructor(private readonly preApprovalService: PreApprovalService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create loan pre-approval',
    description: 'Creates a pre-approval for a loan based on quick assessment. Pre-approval is valid for 30 days.',
  })
  @ApiBody({ type: CreatePreApprovalDto })
  @ApiResponse({
    status: 201,
    description: 'Pre-approval created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Not eligible for pre-approval',
  })
  async createPreApproval(
    @Body() dto: CreatePreApprovalDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.preApprovalService.createPreApproval(dto, companyId);
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Get pre-approval by code',
    description: 'Retrieves pre-approval details using the pre-approval code',
  })
  @ApiParam({ name: 'code', description: 'Pre-approval code', example: 'PRE-2024-001234' })
  @ApiResponse({
    status: 200,
    description: 'Pre-approval retrieved successfully',
  })
  async getPreApprovalByCode(
    @Param('code') code: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.preApprovalService.getPreApprovalByCode(code, companyId);
  }

  @Get('applicant/:applicantId')
  @ApiOperation({
    summary: 'Get active pre-approvals for applicant',
    description: 'Retrieves all active pre-approvals for a specific applicant',
  })
  @ApiParam({ name: 'applicantId', description: 'Applicant ID' })
  @ApiQuery({ name: 'applicantType', description: 'Applicant type', enum: ['Customer', 'Employee', 'Company'] })
  @ApiResponse({
    status: 200,
    description: 'Pre-approvals retrieved successfully',
  })
  async getActivePreApprovals(
    @Param('applicantId') applicantId: string,
    @Query('applicantType') applicantType: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.preApprovalService.getActivePreApprovals(applicantId, applicantType, companyId);
  }

  @Post('use/:code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Use pre-approval in application',
    description: 'Marks a pre-approval as used when creating a loan application',
  })
  @ApiParam({ name: 'code', description: 'Pre-approval code' })
  @ApiQuery({ name: 'applicationId', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Pre-approval used successfully',
  })
  async usePreApproval(
    @Param('code') code: string,
    @Query('applicationId') applicationId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.preApprovalService.usePreApproval(code, applicationId, companyId);
    return { message: 'Pre-approval used successfully' };
  }
}

