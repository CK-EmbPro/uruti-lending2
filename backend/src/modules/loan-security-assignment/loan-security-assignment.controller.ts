import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
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
import { LoanSecurityAssignmentService } from './loan-security-assignment.service';
import { CreateLoanSecurityAssignmentDto } from './dto/create-loan-security-assignment.dto';

@ApiTags('loan-security-assignments')
@ApiBearerAuth('JWT-auth')
@Controller('loan-security-assignments')
export class LoanSecurityAssignmentController {
  constructor(
    private readonly assignmentService: LoanSecurityAssignmentService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create loan security assignment',
    description: 'Creates a new security assignment with pledged securities',
  })
  @ApiBody({ type: CreateLoanSecurityAssignmentDto })
  @ApiResponse({
    status: 201,
    description: 'Security assignment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  create(@Body() createDto: CreateLoanSecurityAssignmentDto) {
    return this.assignmentService.create(createDto);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Submit security assignment',
    description: 'Submits a security assignment and updates loan maximum amount',
  })
  @ApiParam({ name: 'id', description: 'Assignment UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Assignment submitted successfully',
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  submit(@Param('id') id: string) {
    return this.assignmentService.submit(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all security assignments',
    description: 'Retrieves a list of all security assignments',
  })
  @ApiQuery({
    name: 'loanId',
    required: false,
    description: 'Filter by loan ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of assignments retrieved successfully',
  })
  findAll(@Query('loanId') loanId?: string) {
    return this.assignmentService.findAll(loanId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get security assignment by ID',
    description: 'Retrieves a specific security assignment by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Assignment UUID', type: String })
  @ApiResponse({ status: 200, description: 'Assignment found' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  findOne(@Param('id') id: string) {
    return this.assignmentService.findOne(id);
  }

  @Get('loan/:loanId')
  @ApiOperation({
    summary: 'Get security assignments by loan ID',
    description: 'Retrieves all pledged security assignments for a specific loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Assignments found' })
  findByLoanId(@Param('loanId') loanId: string) {
    return this.assignmentService.findByLoanId(loanId);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel security assignment',
    description: 'Cancels a security assignment',
  })
  @ApiParam({ name: 'id', description: 'Assignment UUID', type: String })
  @ApiResponse({ status: 200, description: 'Assignment cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  cancel(@Param('id') id: string) {
    return this.assignmentService.cancel(id);
  }

  @Post('from-application/:applicationId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create security assignment from application',
    description:
      'Creates a security assignment from an approved loan application',
  })
  @ApiParam({
    name: 'applicationId',
    description: 'Loan Application UUID',
    type: String,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loanId: {
          type: 'string',
          description: 'Optional loan ID to link assignment',
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Security assignment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid application status' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  createFromApplication(
    @Param('applicationId') applicationId: string,
    @Body() body?: { loanId?: string },
  ) {
    return this.assignmentService.createFromApplication(
      applicationId,
      body?.loanId,
    );
  }

  @Post('unpledge/:loanId')
  @ApiOperation({
    summary: 'Unpledge security',
    description:
      'Unpledges securities for a loan. If no security map provided, unpledges all.',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        securityMap: {
          type: 'object',
          description:
            'Map of securityId to quantity to unpledge. If not provided, unpledges all.',
          additionalProperties: { type: 'number' },
        },
      },
    },
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Security unpledged successfully' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 400, description: 'No pledged securities found' })
  unpledgeSecurity(
    @Param('loanId') loanId: string,
    @Body() body?: { securityMap?: Record<string, number> },
  ) {
    const securityMap = body?.securityMap
      ? new Map(Object.entries(body.securityMap))
      : undefined;
    return this.assignmentService.unpledgeSecurity(loanId, securityMap);
  }

  @Post(':id/release')
  @ApiOperation({
    summary: 'Release security assignment',
    description:
      'Releases a security assignment after approval. Can only be done if loan is fully paid.',
  })
  @ApiParam({ name: 'id', description: 'Assignment UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Security assignment released successfully',
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot release (loan has outstanding amount or invalid status)',
  })
  releaseSecurityAssignment(@Param('id') id: string) {
    return this.assignmentService.releaseSecurityAssignment(id);
  }
}

